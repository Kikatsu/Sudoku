import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gameToCloudBlob } from "../../lib/cloudSync.js";
import { supabase } from "../../lib/supabaseClient.js";
import { getElapsed } from "../game/gameRepository.js";
import {
  applyCollaborationAction,
  getActiveMembers,
  getVoteThreshold,
  validateCollaborationAction,
} from "./collaborationRules.js";
import {
  fetchCollaborationState,
  joinCollaborationRoom,
  proposeCollaborationMove,
  sendCollaborationMessage,
  setCollaborationAutoAgree,
  updateCollaborationPresence,
  voteCollaborationMove,
} from "./collaborationService.js";

export function useCollaborationRoom({
  roomId,
  authUser,
  profile,
  game,
  setGame,
  preferences,
  onToast,
  labels,
}) {
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [votes, setVotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const roomVersionRef = useRef(null);
  const refreshRef = useRef(null);

  const enabled = Boolean(roomId && authUser?.id && supabase);
  const currentMember = useMemo(
    () => members.find((member) => member.user_id === authUser?.id) || null,
    [members, authUser?.id],
  );
  const activeMembers = useMemo(() => getActiveMembers(members), [members]);
  const activeMemberIds = useMemo(() => new Set(activeMembers.map((member) => member.user_id)), [activeMembers]);
  const pendingProposals = useMemo(
    () =>
      proposals
        .filter((proposal) => proposal.status === "pending" && proposal.board_version === (room?.boardVersion || 0))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [proposals, room?.boardVersion],
  );
  const remoteSelections = useMemo(
    () =>
      activeMembers
        .filter((member) => member.user_id !== authUser?.id && Number.isInteger(member.selected_cell))
        .map((member) => ({
          userId: member.user_id,
          name: member.display_name,
          index: member.selected_cell,
          color: member.color_token,
        })),
    [activeMembers, authUser?.id],
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const state = await fetchCollaborationState(supabase, roomId);
      setRoom(state.room);
      setMembers(state.members);
      setProposals(state.proposals);
      setVotes(state.votes);
      setMessages(state.messages);
      setError("");
      if (state.room?.currentGame && roomVersionRef.current !== state.room.boardVersion) {
        roomVersionRef.current = state.room.boardVersion;
        setGame(state.room.currentGame);
      }
    } catch (err) {
      setError(err?.message || labels?.errors?.load || "Could not load room.");
    }
  }, [enabled, roomId, setGame, labels]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setMembers([]);
      setProposals([]);
      setVotes([]);
      setMessages([]);
      setError("");
      return undefined;
    }
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        await joinCollaborationRoom(supabase, {
          roomId,
          authUser,
          displayName: profile?.name,
        });
        if (!cancelled) await refresh();
      } catch (err) {
        if (!cancelled) setError(err?.message || labels?.errors?.join || "Could not join room.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, enabled, authUser?.id, profile?.name, refresh, labels]);

  useEffect(() => {
    if (!enabled) return undefined;
    const channel = supabase
      .channel(`collaboration-room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "collaboration_rooms", filter: `id=eq.${roomId}` }, () => {
        void refreshRef.current?.();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "collaboration_room_members", filter: `room_id=eq.${roomId}` }, () => {
        void refreshRef.current?.();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "collaboration_move_proposals", filter: `room_id=eq.${roomId}` }, () => {
        void refreshRef.current?.();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "collaboration_move_votes" }, () => {
        void refreshRef.current?.();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "collaboration_messages", filter: `room_id=eq.${roomId}` }, () => {
        void refreshRef.current?.();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, roomId]);

  useEffect(() => {
    if (!enabled) return undefined;
    const beat = () => {
      void updateCollaborationPresence(supabase, {
        roomId,
        selectedCell: game?.selected,
      }).catch((err) => setError(err?.message || labels?.errors?.presence || "Presence failed."));
    };
    beat();
    const timer = window.setInterval(beat, 20_000);
    return () => window.clearInterval(timer);
  }, [enabled, roomId, game?.selected, labels]);

  const updateSelection = useCallback(
    (index) => {
      if (!enabled) return;
      void updateCollaborationPresence(supabase, { roomId, selectedCell: index }).catch((err) =>
        setError(err?.message || labels?.errors?.presence || "Presence failed."),
      );
    },
    [enabled, roomId, labels],
  );

  const setAutoAgree = useCallback(
    async (autoAgree) => {
      if (!enabled) return;
      try {
        await setCollaborationAutoAgree(supabase, { roomId, autoAgree });
        await refresh();
      } catch (err) {
        setError(err?.message || labels?.errors?.autoAgree || "Could not update auto-agree.");
      }
    },
    [enabled, roomId, refresh, labels],
  );

  const proposeMove = useCallback(
    async (action) => {
      if (!enabled || !room) return { ok: false, reason: "notReady" };
      const valid = validateCollaborationAction(game, action);
      if (!valid.ok) {
        onToast?.(labels?.errors?.[valid.reason] || labels?.errors?.invalidAction || "That move cannot be proposed.");
        return { ok: false, reason: valid.reason };
      }
      try {
        await proposeCollaborationMove(supabase, {
          roomId,
          action: valid.action,
          boardVersion: room.boardVersion,
        });
        await refresh();
        return { ok: true };
      } catch (err) {
        setError(err?.message || labels?.errors?.proposal || "Could not propose move.");
        return { ok: false, reason: "network" };
      }
    },
    [enabled, room, game, roomId, refresh, onToast, labels],
  );

  const approveProposal = useCallback(
    async (proposal) => {
      if (!enabled || !proposal || !room) return;
      const next = applyCollaborationAction(game, proposal.action, {
        smartNotes: preferences?.smartNotes,
        proposerId: proposal.proposer_id,
      });
      if (!next.applied) {
        onToast?.(labels?.errors?.[next.reason] || labels?.errors?.invalidAction || "That move is no longer valid.");
        await refresh();
        return;
      }
      try {
        await voteCollaborationMove(supabase, {
          proposalId: proposal.id,
          approve: true,
          appliedGame: gameToCloudBlob(next.game, getElapsed(next.game)),
          completed: next.completed,
        });
        await refresh();
      } catch (err) {
        setError(err?.message || labels?.errors?.vote || "Could not approve move.");
      }
    },
    [enabled, room, game, preferences?.smartNotes, refresh, onToast, labels],
  );

  const rejectProposal = useCallback(
    async (proposal) => {
      if (!enabled || !proposal) return;
      try {
        await voteCollaborationMove(supabase, {
          proposalId: proposal.id,
          approve: false,
          appliedGame: null,
          completed: false,
        });
        await refresh();
      } catch (err) {
        setError(err?.message || labels?.errors?.vote || "Could not vote.");
      }
    },
    [enabled, refresh, labels],
  );

  const sendMessage = useCallback(
    async (body) => {
      if (!enabled) return;
      try {
        await sendCollaborationMessage(supabase, {
          roomId,
          displayName: currentMember?.display_name || profile?.name,
          body,
        });
        await refresh();
      } catch (err) {
        setError(err?.message || labels?.errors?.message || "Could not send message.");
      }
    },
    [enabled, roomId, currentMember?.display_name, profile?.name, refresh, labels],
  );

  const voteSummary = useCallback(
    (proposal) => {
      const activeIds = activeMemberIds;
      const approvalCount = votes.filter(
        (vote) => vote.proposal_id === proposal.id && vote.approved && activeIds.has(vote.user_id),
      ).length;
      const myVote = votes.find((vote) => vote.proposal_id === proposal.id && vote.user_id === authUser?.id);
      return {
        approvalCount,
        threshold: getVoteThreshold(activeMembers.length),
        myVote,
      };
    },
    [votes, activeMemberIds, activeMembers.length, authUser?.id],
  );

  return {
    enabled,
    room,
    members,
    activeMembers,
    currentMember,
    pendingProposals,
    remoteSelections,
    messages,
    loading,
    error,
    isHost: room?.hostId === authUser?.id,
    updateSelection,
    setAutoAgree,
    proposeMove,
    approveProposal,
    rejectProposal,
    sendMessage,
    voteSummary,
    refresh,
  };
}
