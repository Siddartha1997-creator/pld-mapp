## Project Overview
A platform for real-time device management designed to connect with ESP32 which can act as a camera and switch as of now, I shall be planning and adding more features to it

## Tech Stack
- React Native (0.74+)
- TypeScript (5.x)
- React Navigation (6.x)
- Do NOT use Redux, MobX, or class components

## Architecture
- Place domain logic in `src/api/` and `src/features/`
- UI primitives in `src/components/`
- Feature-specific screens in `src/screens/`
- Shared utilities in `src/utils/`

## Coding Conventions
- Use strict TypeScript: avoid `any`, always type function arguments and returns
- Use PascalCase for components, camelCase for variables/functions
- Prefer named imports; avoid default imports unless required

## UI/Design Rules
- 8px spacing rhythm
- All colors must meet WCAG AA contrast
- Use only design tokens from `src/theme/`

## Commands
- **Build:** `npm run build`
- **Test:** `npm test`
- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck`

## Testing Quality Bar
- All code must pass typecheck and lint before every commit
- Unit tests required for all business logic

## File Placement Rules
- Place UI primitives in `src/components/`
- Place feature-specific components in their respective `src/screens/` subfolders
- Do not create new folders at the root without approval

## Safe-Change Rules
- Do not modify authentication or authorization flows without explicit approval
- Flag changes to `src/api/auth.ts` and `src/api/client.ts` as high risk

## Domain Jargon
- **MCP**: Main Control Protocol (see `src/api/hivemq.ts`)
- **PLD**: Programmable Logic Device
- **Bridge**: WebSocket bridge for device communication

