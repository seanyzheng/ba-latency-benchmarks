# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript project for **Base Account (BA) latency benchmarks**. The project is designed to measure and benchmark latency for Base Account operations, likely involving Coinbase Developer Platform (CDP) API interactions based on the environment configuration.

## Development Commands

### Essential Commands
- `npm run dev` - Run the project in development mode using tsx
- `npm run build` - Compile TypeScript to JavaScript (outputs to ./dist/)
- `npm start` - Run the compiled JavaScript from dist/
- `npm test` - No tests configured yet (returns error)

### Build Output
- Compiled JavaScript: `dist/index.js`
- Source maps: `dist/index.js.map`

## Environment Configuration

The project uses environment variables for configuration:
- Copy `.env.example` to `.env` and configure:
  - `CDP_API_KEY_ID` - CDP API key ID
  - `CDP_API_KEY_SECRET` - CDP private key
  - `NETWORK_ID` - Network identifier (default: base-sepolia)
  - `REGION` - Regional configuration for testing
  - `CDP_WALLET_SECRET` - Optional wallet authentication key

## Project Structure

- `src/index.ts` - Main entry point (currently minimal)
- `dist/` - Compiled output directory
- TypeScript configuration: ES2020 target, ESNext modules
- Project uses ES modules (`"type": "module"` in package.json)

## Architecture Notes

This appears to be an early-stage project focused on:
- CDP (Coinbase Developer Platform) API integration
- Latency measurement and benchmarking
- Multi-region testing capabilities
- Base network operations

The current implementation is minimal - just console logging. Future development will likely focus on implementing actual latency measurement logic for Base Account operations.