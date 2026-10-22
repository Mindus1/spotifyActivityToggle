/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { definePluginSettings } from "@api/Settings";
import { UserAreaRenderProps } from "@api/UserArea";
import equicordToolbox from "@equicordplugins/equicordToolbox";
import definePlugin, { OptionType } from "@utils/types";
import { ConnectedAccount } from "@vencord/discord-types";
import { findByPropsLazy, findComponentByCodeLazy } from "@webpack";
import { ConnectedAccountsStore, Menu, useStateFromStores } from "@webpack/common";

const PanelButton = findComponentByCodeLazy(".GREEN,positionKeyStemOverride:");
const ConnectedAccountActions = findByPropsLazy("setShowActivity");

// Font Awesome Free 6.7.2 "spotify" icon, CC BY 4.0
const SPOTIFY_PATH = "M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z";

const settings = definePluginSettings({
    location: {
        type: OptionType.SELECT,
        description: "Where to show the Spotify activity toggle button",
        options: [
            { label: "Next to Mute/Deafen", value: "PANEL", default: true },
            { label: "Equicord Toolbox", value: "TOOLBOX" }
        ],
        get hidden() {
            return !isPluginEnabled(equicordToolbox.name);
        }
    }
});

function useSpotifyAccounts() {
    return useStateFromStores([ConnectedAccountsStore], () => ConnectedAccountsStore.getAccounts())
        .filter(account => account.type === "spotify" && !account.revoked);
}

function setSpotifyActivity(accounts: ConnectedAccount[], show: boolean) {
    for (const account of accounts)
        ConnectedAccountActions.setShowActivity(account.type, account.id, show);
}

function SpotifyIcon({ className }: { className?: string; }) {
    const enabled = useSpotifyAccounts().some(account => account.showActivity);

    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24">
            <g fill={enabled ? "currentColor" : "var(--status-danger)"} mask={enabled ? undefined : "url(#vc-spotifyActivityToggle-mask)"}>
                <svg width="24" height="24" viewBox="0 0 496 512">
                    <path d={SPOTIFY_PATH} />
                </svg>
            </g>
            {!enabled && <>
                <path fill="var(--status-danger)" d="M22.7 2.7a1 1 0 0 0-1.4-1.4l-20 20a1 1 0 1 0 1.4 1.4Z" />
                <mask id="vc-spotifyActivityToggle-mask">
                    <rect fill="white" width="24" height="24" />
                    <path fill="black" d="M23.27 4.73 19.27 .73 -.27 20.27 3.73 24.27Z" />
                </mask>
            </>}
        </svg>
    );
}

function SpotifyActivityButton({ hideTooltips, nameplate }: UserAreaRenderProps) {
    const { location } = settings.use(["location"]);
    const accounts = useSpotifyAccounts();

    if (!accounts.length) return null;
    if (location === "TOOLBOX" && isPluginEnabled(equicordToolbox.name)) return null;

    const enabled = accounts.some(account => account.showActivity);

    return (
        <PanelButton
            tooltipText={hideTooltips ? undefined : enabled ? "Disable Spotify Activity" : "Enable Spotify Activity"}
            icon={SpotifyIcon}
            role="switch"
            ariaChecked={!enabled}
            redGlow={!enabled}
            plated={nameplate != null}
            onClick={() => setSpotifyActivity(accounts, !enabled)}
        />
    );
}

export default definePlugin({
    name: "SpotifyActivityToggle",
    description: "Adds a button next to the mic and deafen button to toggle Spotify activity.",
    authors: [{ name: "Mindus", id: 261776328003420161n }],
    dependencies: ["UserAreaAPI"],
    settings,

    userAreaButton: {
        icon: SpotifyIcon,
        priority: -1,
        render: SpotifyActivityButton
    },

    toolboxActions() {
        const { location } = settings.use(["location"]);
        const accounts = useSpotifyAccounts();

        if (location !== "TOOLBOX" || !accounts.length) return null;

        const enabled = accounts.some(account => account.showActivity);

        return (
            <Menu.MenuCheckboxItem
                id="vc-spotifyActivityToggle-toolbox"
                label="Enable Spotify Activity"
                checked={enabled}
                action={() => setSpotifyActivity(accounts, !enabled)}
            />
        );
    }
});
