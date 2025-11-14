# Prompt Perfection: A Next.js Workspace for Gemini

[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini-blue.svg)](https://ai.google.dev/)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black.svg)](https://nextjs.org/)
[![UI by shadcn/ui](https://img.shields.io/badge/UI-shadcn/ui-black.svg)](https://ui.shadcn.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Prompt Perfection is an advanced, open-source web application for crafting, refining, and perfecting prompts for Google's Gemini models. It provides a rich, interactive workspace that supports both text and multimodal image generation, helping users translate their creative ideas into high-quality, model-ready prompts.

## Key Features

-   **Interactive Refinement:** Instead of just writing a prompt, engage in a "creative consultation" with an AI assistant that asks clarifying multiple-choice questions to fill in missing details and improve your prompt.
-   **Multimodal Image Prompts:** Go beyond text. Upload 1-4 reference images to ground the AI, enabling workflows like editing, composition, and style transfer.
-   **Bring Your Own Key (BYOK):** Securely use your own Gemini API key. The key is managed server-side via an `HttpOnly` cookie, never exposed to the client, and stored ephemerally.
-   **Session Management:** Save, load, import, and export your work sessions locally. Your progress is always preserved.
-   **Model & Family Switching:** Easily switch between different Gemini models, including `gemini-2.5-flash-image` for image generation and text-based models. The UI adapts to provide relevant tools for each family.
-   **Token Preflight & Usage Tracking:** Get an accurate, real-time token count for your next API call. After refinement, see a detailed breakdown of token usage, including any savings from context caching.
-   **Built-in Guidance:** Leverage prompt templates for common use cases (e.g., logos, photorealistic scenes) and contextual tips to improve your prompt engineering skills.
-   **Advanced Caching:** Utilizes Gemini's explicit context caching to significantly reduce token consumption on iterative refinements by caching the stable parts of your prompt.
-   **Modern Tech Stack:** Built with the Next.js App Router, TypeScript, and shadcn/ui for a fast, type-safe, and beautiful user experience.

## Support This Project

Prompt Perfection is free and open-source. If you find it valuable, consider supporting its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/pablomiar)

Your support helps maintain the project and add new features. Thank you! 🙏

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **AI:** [Google Generative AI SDK](https://ai.google.dev/sdks) for Gemini
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **State Management:** [Jotai](https://jotai.org/) & [XState](https://xstate.js.org/) for complex client-side logic
-   **Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
-   **Deployment:** Optimized for [Vercel](https://vercel.com/)

## Getting Started

Follow these instructions to set up and run the project locally for development.

### Prerequisites

-   Node.js (v20 or later recommended)
-   A package manager like `npm`, `pnpm`, or `yarn`
-   A Google Gemini API Key. You can get one for free from [Google AI Studio](https://ai.google.dev/gemini-api).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/pma1999/prompter.git
    cd prompter
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    The application requires a secret key for securing user sessions. Create a `.env.local` file in the project root.
    ```bash
    touch .env.local
    ```
    You can use the provided PowerShell script to generate a secure secret and populate this file automatically.

    **Using the script (Windows with PowerShell):**
    ```powershell
    ./scripts/set-byok-secret.ps1
    ```
    This script will generate secure keys and write them to `.env.local`.

    **Manual setup:**
    If you are not on Windows or prefer to set it up manually, generate a secure, URL-safe random string (at least 32 characters) and add it to your `.env.local` file:
    ```
    # .env.local
    BYOK_SECRET_CURRENT=your_secure_random_string_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the application:**
    Navigate to `http://localhost:3000` in your browser. You will be prompted to enter your Gemini API key through the UI to start using the application.

## Deployment

The project is optimized for deployment on [Vercel](https://vercel.com).

### Vercel Configuration

1.  **Link the project:**
    Use the Vercel CLI to link your local repository to a Vercel project.
    ```bash
    npx vercel link
    ```

2.  **Set Production Environment Variables:**
    The BYOK authentication system requires server-side secrets for encrypting session data. Use the provided `set-byok-secret.ps1` script to securely generate and upload these secrets to Vercel.

    ```powershell
    # This will generate and set secrets for both 'production' and 'preview' environments.
    ./scripts/set-byok-secret.ps1
    ```

    This script sets `BYOK_SECRET_CURRENT` and `BYOK_SECRET_PREVIOUS_1` (for seamless key rotation) in your Vercel project settings.

3.  **Deployment Recommendation:**
    For the in-memory BYOK session store to work consistently, it's recommended to deploy the project to a **single Vercel region** (`home`). The API routes are already configured with `preferredRegion: 'home'`. If you need to scale to multiple regions, the in-memory store in `src/lib/server/keyStore.ts` should be replaced with a shared solution like Vercel KV or Redis.

## Architectural Overview

### Bring Your Own Key (BYOK) System

The application ensures that user API keys are handled securely.
-   **No Client-Side Exposure:** The Gemini API key is never stored in `localStorage` or exposed to client-side scripts.
-   **Server-Side Storage:** When a user submits their key, it's sent to a dedicated API endpoint (`/api/auth/key`), stored in a server-side, in-memory map, and associated with a unique session ID.
-   **Secure Cookie:** The session ID is sent back to the client in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. This cookie is automatically included in subsequent requests to `/api/*` endpoints.
-   **API Calls:** All calls to the Gemini API are proxied through the Next.js server, which retrieves the user's key from the in-memory store using the session ID from the cookie.

### Gemini Context Caching

To optimize performance and reduce costs, the application leverages Gemini's context caching feature.
-   **Implicit Caching:** Enabled by default. The Gemini backend may automatically cache repeated, large parts of prompts.
-   **Explicit Caching:** Used for the iterative refinement process. The stable prefix of a prompt (persona, rules, raw prompt, and reference images) is explicitly cached. Subsequent refinement steps only send the small, dynamic suffix (the user's answers to clarifying questions), leading to significant token savings. This cache is scoped per-conversation.

## Environment Variables

| Variable                          | Description                                                                          | Default (Dev) | Required (Prod) |
| --------------------------------- | ------------------------------------------------------------------------------------ | ------------- | --------------- |
| `BYOK_SECRET_CURRENT`             | The primary secret for encrypting BYOK session cookies.                                | `""`          | **Yes**         |
| `BYOK_SECRET_PREVIOUS_1`          | An optional previous secret to allow for seamless key rotation without logging users out. | `""`          | No              |
| `BYOK_ENCRYPTED_COOKIE_ENABLED`   | Enables a stateless, encrypted cookie fallback for the API key.                      | `true`        | `false`         |
| `REFINER_EXPLICIT_CACHE_ENABLED`  | Enables the explicit per-conversation caching feature.                               | `false`       | No              |
| `REFINER_CACHE_MODE`              | Sets the default cache mode.                                                         | `implicit_only` | No              |
| `REFINER_CACHE_DEFAULT_TTL_SECONDS` | Default time-to-live for explicit caches in seconds.                                 | `900`         | No              |
| `RESEND_API_KEY`                  | API key for Resend email service used for sending user feedback.                     | `""`          | **Yes**         |
| `FEEDBACK_EMAIL`                  | Email address to receive user feedback submissions.                                  | `""`          | **Yes**         |

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.