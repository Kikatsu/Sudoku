import { gameToCloudBlob, hydrateGameFromCloud } from "../../lib/cloudSync.js";
import { getElapsed } from "../game/gameRepository.js";
import { colorForUser, getCollaborationLimit } from "./collaborationRules.js";

export function normalizeRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    hostId: row.host_id,
    currentGame: hydrateGameFromCloud(row.current_game) || row.current_game || null,
    boardVersion: row.board_version || 0,
    maxParticipants: row.max_participants || 5,
    status: row.status || "active",
    solvedAt: row.solved_at || null,
    updatedAt: row.updated_at || null,
  };
}

export function normalizeMember(row) {
  if (!row) return null;
  return {
    room_id: row.room_id,
    user_id: row.user_id,
    display_name: row.display_name || "Player",
    auto_agree: Boolean(row.auto_agree),
    selected_cell: Number.isInteger(row.selected_cell) ? row.selected_cell : null,
    color_token: row.color_token || colorForUser(row.user_id),
    last_seen_at: row.last_seen_at,
    joined_at: row.joined_at,
  };
}

export function normalizeProposal(row) {
  if (!row) return null;
  return {
    id: row.id,
    room_id: row.room_id,
    proposer_id: row.proposer_id,
    action: row.action,
    board_version: row.board_version || 0,
    status: row.status || "pending",
    created_at: row.created_at,
    applied_at: row.applied_at,
  };
}

export function normalizeVote(row) {
  if (!row) return null;
  return {
    proposal_id: row.proposal_id,
    user_id: row.user_id,
    approved: row.approved !== false,
    created_at: row.created_at,
  };
}

export function normalizeMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    room_id: row.room_id,
    user_id: row.user_id,
    display_name: row.display_name || "Player",
    body: row.body || "",
    created_at: row.created_at,
  };
}

export async function createCollaborationRoom(client, { authUser, profile, game, isPro }) {
  if (!client || !authUser?.id) throw new Error("authRequired");
  const payload = {
    host_id: authUser.id,
    current_game: gameToCloudBlob(game, getElapsed(game)),
    board_version: 0,
    max_participants: getCollaborationLimit(isPro),
    status: "active",
  };
  const { data: room, error } = await client
    .from("collaboration_rooms")
    .insert(payload)
    .select("id, host_id, current_game, board_version, max_participants, status, solved_at, updated_at")
    .single();
  if (error) throw error;
  await joinCollaborationRoom(client, {
    roomId: room.id,
    authUser,
    displayName: profile?.name,
  });
  return normalizeRoom(room);
}

export async function joinCollaborationRoom(client, { roomId, authUser, displayName }) {
  if (!client || !authUser?.id) throw new Error("authRequired");
  const { data, error } = await client.rpc("join_collaboration_room", {
    p_room_id: roomId,
    p_display_name: displayName || authUser.email?.split("@")[0] || "Player",
    p_color_token: colorForUser(authUser.id),
  });
  if (error) throw error;
  return data;
}

export async function fetchCollaborationState(client, roomId) {
  const [roomRes, membersRes, proposalsRes, votesRes, messagesRes] = await Promise.all([
    client
      .from("collaboration_rooms")
      .select("id, host_id, current_game, board_version, max_participants, status, solved_at, updated_at")
      .eq("id", roomId)
      .maybeSingle(),
    client
      .from("collaboration_room_members")
      .select("room_id, user_id, display_name, auto_agree, selected_cell, color_token, last_seen_at, joined_at")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true }),
    client
      .from("collaboration_move_proposals")
      .select("id, room_id, proposer_id, action, board_version, status, created_at, applied_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("collaboration_move_votes")
      .select("proposal_id, user_id, approved, created_at"),
    client
      .from("collaboration_messages")
      .select("id, room_id, user_id, display_name, body, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (roomRes.error) throw roomRes.error;
  if (membersRes.error) throw membersRes.error;
  if (proposalsRes.error) throw proposalsRes.error;
  if (votesRes.error) throw votesRes.error;
  if (messagesRes.error) throw messagesRes.error;
  return {
    room: normalizeRoom(roomRes.data),
    members: (membersRes.data || []).map(normalizeMember).filter(Boolean),
    proposals: (proposalsRes.data || []).map(normalizeProposal).filter(Boolean),
    votes: (votesRes.data || []).map(normalizeVote).filter(Boolean),
    messages: (messagesRes.data || []).reverse().map(normalizeMessage).filter(Boolean),
  };
}

export async function updateCollaborationPresence(client, { roomId, selectedCell }) {
  const { error } = await client.rpc("update_collaboration_presence", {
    p_room_id: roomId,
    p_selected_cell: Number.isInteger(selectedCell) ? selectedCell : null,
  });
  if (error) throw error;
}

export async function setCollaborationAutoAgree(client, { roomId, autoAgree }) {
  const { error } = await client.rpc("set_collaboration_auto_agree", {
    p_room_id: roomId,
    p_auto_agree: Boolean(autoAgree),
  });
  if (error) throw error;
}

export async function proposeCollaborationMove(client, { roomId, action, boardVersion }) {
  const { data, error } = await client.rpc("propose_collaboration_move", {
    p_room_id: roomId,
    p_action: action,
    p_board_version: boardVersion,
  });
  if (error) throw error;
  return data;
}

export async function voteCollaborationMove(client, { proposalId, approve, appliedGame, completed }) {
  const { data, error } = await client.rpc("vote_collaboration_move", {
    p_proposal_id: proposalId,
    p_approve: approve !== false,
    p_applied_game: appliedGame || null,
    p_completed: Boolean(completed),
  });
  if (error) throw error;
  return data;
}

export async function sendCollaborationMessage(client, { roomId, displayName, body }) {
  const clean = String(body || "").trim().slice(0, 500);
  if (!clean) return null;
  const { data, error } = await client
    .from("collaboration_messages")
    .insert({ room_id: roomId, display_name: displayName || "Player", body: clean })
    .select("id, room_id, user_id, display_name, body, created_at")
    .single();
  if (error) throw error;
  return normalizeMessage(data);
}
