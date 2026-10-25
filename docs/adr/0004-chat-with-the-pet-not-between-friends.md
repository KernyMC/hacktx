# 0004 — The chat is with the pet, not between friends

**Date**: 2026-10-25
**Status**: Accepted

## Context

The user proposed "some kind of chat". Two readings: chat with the pet (AI in character) or messaging
between friends in the village.

## Decision

Chat **with the pet**: `POST /api/chat` with Gemini in character (it knows mood, hunger, level and
today's quests; its job is to get you outside), spoken reply with the species' ElevenLabs voice.
"Talk" button on the stage.

## Why

- Fits the Meta track ("AI that brings people closer") and the game loop: the AI pushes you to do the
  real quest.
- Friend-to-friend messaging needs auth, persistence and realtime (Supabase Realtime or similar): it
  does not fit in 24 h and adds less to the pitch than the pet chat.

## Consequence

If a backend with real friends arrives later, friend chat is built separately; the pet chat stays the
"AI" channel and must not be mixed with human messages.
