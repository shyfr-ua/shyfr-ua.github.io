# ШИФР: рекламний лендінг

Live path (when GitHub Pages is published): https://shyfr-ua.github.io/play/

## Реклама

Example for ChatGPT Ads:

https://shyfr-ua.github.io/play/?utm_source=chatgpt&utm_medium=cpc&utm_campaign=launch&utm_content=ad1

For Meta: utm_source=meta&utm_medium=cpc&utm_campaign=launch&utm_content=a1

For TikTok: utm_source=tiktok&utm_medium=cpc&utm_campaign=launch&utm_content=a1

For debug: append &debug=1 (does not show the raw oppref value).

## Bot attribution

Existing bot v5.10.76 supports `/start src_<source>`, with source codes up to 56 ASCII letters, digits, underscore or dash. The page generates e.g. `https://t.me/Shyfr_ua_bot?start=src_chatgpt_ads_launch_ad1`. No bot patch or restart is needed.

Existing /admin_sources statistics count the first tracked entry and how many users started or finished any game by that source. Returning users with a previous acquisition record do not count again. The page stores recent UTM parameters in localStorage for up to 7 days of attribution lookback.

## OpenAI Pixel

Open Ads Manager > Conversions > create Web data source; copy Pixel ID into `play/config.js` (currently intentionally empty). Only after a visitor explicitly consents, the page loads https://bzrcdn.openai.com/sdk/oaiq.min.js and sends `page_viewed`; outbound button click sends custom event `telegram_open_clicked`. These are **landing events**, NOT confirmed Telegram game starts.

OpenAI `oppref` stays on the landing URL so the JS Pixel can read it, but is NOT transferred to Telegram or used by CAPI. To optimize for `registration_completed` or a bot game-start event, a separate server-side conversion bridge with properly authorized Conversions API credentials and consent propagation is still needed.

Check real events in Ads Manager; check actual users/game starts/completions via bot's existing /admin_sources. Don't optimize for fake registrations or click-outs as if they were real game starts.

## Safe testing

1. Use one normal browser and one private window.
2. Open a UTM link with `&debug=1`, inspect generated Telegram payload, click without consent: there should be **no** OpenAI Pixel request.
3. Enter a real Pixel ID in config.js, accept analytics, confirm `page_viewed` in Pixel debug/Ads Manager, click CTA and confirm `telegram_open_clicked`.
4. Test with a **new** Telegram account; check `/admin_sources` for `chatgpt_ads_launch_ad1`. Bot reports first tracked source only.
5. Ensure current production bot stays running, no changes to current GitHub Pages root or social-sharing pages.

Note: GitHub Pages is static and cannot safely store a secret CAPI key.
