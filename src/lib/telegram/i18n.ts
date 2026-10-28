/**
 * Bot translations (English / Persian). Keys are flat; `{name}` placeholders
 * are replaced by `t()`. The Persian table must define every English key
 * (enforced by `satisfies`).
 */

export type Lang = "en" | "fa";
export const LANGS: Lang[] = ["en", "fa"];

const en = {
  /* reply-keyboard buttons (also matched when the user taps them) */
  "btn.profile": "👤 Profile",
  "btn.connect": "🔗 Connect GitHub",
  "btn.how": "ℹ️ How it works",
  "btn.stats": "📊 Statistics",
  "btn.activity": "🕒 Recent activity",
  "btn.repos": "📁 Repositories",
  "btn.notifications": "🔔 Notifications",
  "btn.top": "🏆 Top",
  "btn.language": "🌐 Language",
  "btn.help": "❓ Help",
  "placeholder": "Choose an option…",

  /* inline buttons */
  "ib.openSite": "🌐 Open website",
  "ib.connectGithub": "🔗 Connect GitHub on the website",
  "ib.signIn": "🔐 Sign in / Create account",
  "ib.linkChat": "🤖 Link this chat",
  "ib.dashboard": "📊 Dashboard",
  "ib.settings": "⚙️ Settings",
  "ib.pause": "⏸ Pause notifications",
  "ib.resume": "▶️ Resume notifications",
  "ib.today": "Today",
  "ib.d7": "7 days",
  "ib.d30": "30 days",
  "ib.fixConnection": "🔧 Fix connection",

  /* event fields */
  "f.repository": "Repository",
  "f.by": "By",
  "f.user": "User",
  "f.branch": "Branch",
  "f.commits": "Commits",
  "f.totalStars": "Total stars",
  "f.fork": "Fork",
  "f.base": "Base",
  "f.review": "Review",
  "f.on": "On",
  "f.tag": "Tag",
  "f.title": "Title",
  "f.type": "Type",
  "f.name": "Name",
  "f.workflow": "Workflow",
  "f.environment": "Environment",
  "f.ref": "Ref",
  "f.followers": "Followers",
  "f.more": "… and {n} more",

  /* batch */
  "batch.title": "📦 <b>{n} new events</b>",
  "batch.range": "{from} → {to}",
  "batch.commits": "🔨 {n} commits → {branches}",
  "batch.stars": "⭐ {n} new stars (total {total})",
  "batch.forks": "🍴 {n} new forks",
  "batch.followers": "👤 {n} new followers (now {total})",
  "batch.unfollowers": "👋 {n} unfollows (now {total})",
  "batch.other": "• {label} ×{n}",
  "batch.moreRepos": "… and {n} more repositories",

  /* milestones */
  "ms.stars": "🎉 <b>Milestone reached!</b>\n{divider}\n⭐ <b>{repo}</b> just hit <b>{n} stars</b>!\nGreat work — keep shipping 🚀",
  "ms.followers": "🎉 <b>Milestone reached!</b>\n{divider}\n👥 You now have <b>{n} followers</b> on GitHub!\nThanks for building in public 💚",

  /* connection health */
  "health.title": "🩺 <b>Connection alert</b>",
  "health.suspended": "Your GitHub App installation was <b>suspended</b>. Monitoring is paused until it is unsuspended.",
  "health.deleted": "Your GitHub App installation was <b>removed</b>. Events can no longer be received — reconnect GitHub to resume monitoring.",
  "health.unsuspended": "✅ Your GitHub App installation is <b>active again</b>. Monitoring has resumed.",
  "health.reposRemoved": "{n} repositories were <b>removed</b> from the GitHub App's access: {names}",
  "health.unreachable": "GitHub Monitor could not reach GitHub with your connection (it may have been revoked or the token expired). Open the website to check it.",

  /* guest screens */
  "hello.named": "Hi {name}! 👋",
  "hello.anon": "Hi there! 👋",
  "guest.title": "🛰 <b>Welcome to GitHub Monitor</b>",
  "guest.intro": "A self-hosted dashboard that watches your GitHub repositories — and this bot delivers everything to you <b>in real time</b>.",
  "guest.whatYouGet": "<b>What you get:</b>",
  "guest.l1": "🔨 Commits, ⭐ stars, 🍴 forks",
  "guest.l2": "🔀 Pull requests, 🐛 issues, 💬 comments",
  "guest.l3": "🚀 Releases, ⚙️ workflows, 📦 deployments",
  "guest.l4": "👤 New followers",
  "guest.notConnected": "<b>You're not connected yet.</b> Create an account on the website, link GitHub, then open <b>Settings → Telegram</b> and scan the QR code.",
  "guest.cta": "Use the buttons below to get started 👇",
  "guest.webPrompt": "🌐 Get started on the website:",
  "quick": "Quick links 👇",

  "how.title": "ℹ️ <b>How it works</b>",
  "how.s1": "<b>1.</b> Sign up on the website and connect your GitHub account.",
  "how.s2": "<b>2.</b> Choose which repositories to monitor and which event types matter.",
  "how.s3": "<b>3.</b> Open <b>Settings → Telegram</b>, scan the QR code (or tap the link) and press <b>Start</b> here.",
  "how.s4": "<b>4.</b> Every event is recorded on the dashboard <i>and</i> sent to this chat instantly.",
  "how.foot": "🔒 You can pause notifications or disconnect at any time — from the site or with /stop.",

  "guestProfile.title": "👤 <b>Profile</b>",
  "guestProfile.status": "🔴 <b>Status:</b> Not connected",
  "guestProfile.body": "This chat isn't linked to a GitHub Monitor account yet. Sign in on the website, then link this chat from <b>Settings → Telegram</b>.",

  "connect.title": "🔗 <b>Connect GitHub</b>",
  "connect.body": "Open the website to sign in and install the GitHub App on your account. After that, pick the repositories you want to monitor.",
  "connect.tap": "👇 Tap the button below.",

  /* member screens */
  "member.welcomeBack": "👋 Welcome back{name}!",
  "member.connected": "✅ This chat is connected. You'll receive every event from your monitored repositories right here.",
  "member.useMenu": "Use the menu below or type /help.",

  "linked.title": "✅ <b>Connected!</b>",
  "linked.body": "Hi{name}, this chat is now linked to your GitHub Monitor account.",
  "linked.foot": "From now on you'll get a message here the moment something happens in your monitored repositories.",
  "linked.try": "📊 Try <b>Statistics</b> or <b>Recent activity</b> from the menu below.",

  "profile.title": "👤 <b>Profile</b>",
  "profile.status": "🟢 <b>Status:</b> Connected",
  "profile.name": "🙍 <b>Name:</b> {v}",
  "profile.email": "✉️ <b>Email:</b> {v}",
  "profile.github": "🐙 <b>GitHub:</b> {v}",
  "profile.githubNone": "not connected yet",
  "profile.notifications": "🔔 <b>Notifications:</b> {v}",
  "profile.since": "📅 <b>Linked since:</b> {v}",
  "profile.groups": "👥 <b>Groups/channels:</b> {v}",
  "profile.overview": "<b>Overview</b>",
  "profile.repos": "📁 Repositories: {a}  ·  👁 Monitored: {b}",
  "profile.events": "⚡ Events today: {a}  ·  🗂 Total: {b}",
  "on": "ON",
  "off": "OFF",

  "stats.title": "📊 <b>Statistics — {range}</b>",
  "stats.today": "Today",
  "stats.7d": "Last 7 days",
  "stats.30d": "Last 30 days",
  "stats.commits": "🔨 Commits: <b>{n}</b>",
  "stats.stars": "⭐ Stars: <b>{n}</b>",
  "stats.forks": "🍴 Forks: <b>{n}</b>",
  "stats.prs": "🔀 Pull requests: <b>{n}</b>",
  "stats.issues": "🐛 Issues: <b>{n}</b>",
  "stats.releases": "🚀 Releases: <b>{n}</b>",
  "stats.total": "Σ Total: <b>{n}</b>",

  "activity.title": "🕒 <b>Recent activity</b>",
  "activity.empty": "No events yet. They'll appear here as soon as something happens.",

  "repos.title": "📁 <b>Monitored repositories</b> ({n})",
  "repos.empty": "You aren't monitoring any repository yet. Enable monitoring from the Repositories page on the website.",

  "top.title": "🏆 <b>Top this week</b>",
  "top.repos": "<b>⭐ Most starred repositories</b>",
  "top.active": "<b>🔥 Most active repositories (7 days)</b>",
  "top.actors": "<b>🧑‍💻 Most active contributors (7 days)</b>",
  "top.events": "{n} events",
  "top.empty": "Nothing to rank yet — activity will show up here.",

  "notif.title": "🔔 <b>Notifications</b>",
  "notif.current": "Currently: <b>{v}</b>",
  "notif.onText": "You receive every event from your monitored repositories.",
  "notif.offText": "Events are still recorded on the dashboard, but nothing is sent here.",
  "notif.toastOn": "Notifications ON",
  "notif.toastOff": "Notifications paused",

  "help.title": "❓ <b>Help</b>",
  "help.commands": "<b>Commands</b>",
  "help.start": "/start — main menu",
  "help.profile": "/profile — your account",
  "help.stats": "/stats — event statistics",
  "help.activity": "/activity — latest events",
  "help.repos": "/repos — monitored repositories",
  "help.top": "/top — weekly leaderboard",
  "help.notifications": "/notifications — pause / resume alerts",
  "help.language": "/language — change language",
  "help.connect": "/connect — how to connect GitHub",
  "help.stop": "/stop — disconnect this chat",
  "help.help": "/help — this message",

  "lang.title": "🌐 <b>Language</b>",
  "lang.body": "Choose the language of the bot's messages:",
  "lang.changed": "Language set to English 🇬🇧",

  /* misc replies */
  "need.member": "🔒 This feature needs a connected account. Open <b>Settings → Telegram</b> on the website to link this chat.",
  "unknown": "I didn't get that 🤔 Use the menu below or type /help.",
  "err.inUse": "⚠️ This Telegram account is already linked to another GitHub Monitor user. Send /stop first, then try again.",
  "err.badLink": "❌ This link is invalid or has expired. Generate a new one from <b>Settings → Telegram</b>.",
  "stop.done": "🔌 <b>Disconnected.</b> You will no longer receive notifications.\nSend /start any time to set things up again.",
  "stop.none": "This chat isn't connected.",
  "toast.notConnected": "Not connected",

  /* groups & channels */
  "group.linked": "✅ <b>Group connected!</b>\nThis chat will now receive GitHub Monitor notifications. Use /stop here (admins only) to disconnect.",
  "group.badLink": "❌ This link is invalid or has expired. Generate a new one from <b>Settings → Telegram</b>.",
  "group.stopped": "🔌 This chat was disconnected from GitHub Monitor.",
  "group.adminOnly": "Only group admins can do this.",
  "group.notLinked": "This chat isn't linked to GitHub Monitor.",
  "group.status": "✅ This chat is linked and receives notifications.",
} as const;

export type MessageKey = keyof typeof en;

const fa = {
  "btn.profile": "👤 پروفایل",
  "btn.connect": "🔗 اتصال به گیت‌هاب",
  "btn.how": "ℹ️ نحوه کار",
  "btn.stats": "📊 آمار",
  "btn.activity": "🕒 فعالیت‌های اخیر",
  "btn.repos": "📁 ریپوزیتوری‌ها",
  "btn.notifications": "🔔 اعلان‌ها",
  "btn.top": "🏆 برترین‌ها",
  "btn.language": "🌐 زبان",
  "btn.help": "❓ راهنما",
  "placeholder": "یک گزینه را انتخاب کنید…",

  "ib.openSite": "🌐 باز کردن سایت",
  "ib.connectGithub": "🔗 اتصال گیت‌هاب در سایت",
  "ib.signIn": "🔐 ورود / ساخت حساب",
  "ib.linkChat": "🤖 اتصال این چت",
  "ib.dashboard": "📊 داشبورد",
  "ib.settings": "⚙️ تنظیمات",
  "ib.pause": "⏸ توقف اعلان‌ها",
  "ib.resume": "▶️ ادامه اعلان‌ها",
  "ib.today": "امروز",
  "ib.d7": "۷ روز",
  "ib.d30": "۳۰ روز",
  "ib.fixConnection": "🔧 رفع مشکل اتصال",

  "f.repository": "ریپوزیتوری",
  "f.by": "توسط",
  "f.user": "کاربر",
  "f.branch": "شاخه",
  "f.commits": "کامیت‌ها",
  "f.totalStars": "مجموع ستاره‌ها",
  "f.fork": "فورک",
  "f.base": "مقصد",
  "f.review": "بازبینی",
  "f.on": "روی",
  "f.tag": "تگ",
  "f.title": "عنوان",
  "f.type": "نوع",
  "f.name": "نام",
  "f.workflow": "ورک‌فلو",
  "f.environment": "محیط",
  "f.ref": "مرجع",
  "f.followers": "فالوورها",
  "f.more": "… و {n} مورد دیگر",

  "batch.title": "📦 <b>{n} رویداد جدید</b>",
  "batch.range": "{from} ← {to}",
  "batch.commits": "🔨 {n} کامیت ← {branches}",
  "batch.stars": "⭐ {n} ستاره جدید (مجموع {total})",
  "batch.forks": "🍴 {n} فورک جدید",
  "batch.followers": "👤 {n} فالوور جدید (اکنون {total})",
  "batch.unfollowers": "👋 {n} آنفالو (اکنون {total})",
  "batch.other": "• {label} ×{n}",
  "batch.moreRepos": "… و {n} ریپوزیتوری دیگر",

  "ms.stars": "🎉 <b>رسیدن به یک نقطه‌عطف!</b>\n{divider}\n⭐ ریپوی <b>{repo}</b> به <b>{n} ستاره</b> رسید!\nعالیه — به ساختن ادامه بده 🚀",
  "ms.followers": "🎉 <b>رسیدن به یک نقطه‌عطف!</b>\n{divider}\n👥 تعداد فالوورهای شما در گیت‌هاب به <b>{n}</b> رسید!\nممنون که در معرض دید می‌سازی 💚",

  "health.title": "🩺 <b>هشدار اتصال</b>",
  "health.suspended": "نصب GitHub App شما <b>معلق</b> شد. تا زمان رفع تعلیق، مانیتورینگ متوقف است.",
  "health.deleted": "نصب GitHub App شما <b>حذف</b> شد. دیگر رویدادی دریافت نمی‌شود — برای ادامه، گیت‌هاب را دوباره وصل کنید.",
  "health.unsuspended": "✅ نصب GitHub App شما <b>دوباره فعال</b> شد و مانیتورینگ از سر گرفته شد.",
  "health.reposRemoved": "{n} ریپوزیتوری از دسترسی GitHub App <b>حذف</b> شد: {names}",
  "health.unreachable": "GitHub Monitor نتوانست با اتصال شما به گیت‌هاب دسترسی پیدا کند (ممکن است لغو شده یا توکن منقضی شده باشد). برای بررسی، سایت را باز کنید.",

  "hello.named": "سلام {name}! 👋",
  "hello.anon": "سلام! 👋",
  "guest.title": "🛰 <b>به GitHub Monitor خوش آمدید</b>",
  "guest.intro": "یک داشبورد مانیتورینگ گیت‌هاب که ریپوهای شما را زیر نظر دارد — و این ربات همه‌چیز را <b>لحظه‌ای</b> برایتان می‌فرستد.",
  "guest.whatYouGet": "<b>چه چیزهایی دریافت می‌کنید:</b>",
  "guest.l1": "🔨 کامیت، ⭐ استار، 🍴 فورک",
  "guest.l2": "🔀 پول‌ریکوئست، 🐛 ایشو، 💬 کامنت",
  "guest.l3": "🚀 ریلیز، ⚙️ ورک‌فلو، 📦 دیپلوی",
  "guest.l4": "👤 فالوورهای جدید",
  "guest.notConnected": "<b>هنوز متصل نشده‌اید.</b> در سایت حساب بسازید، گیت‌هاب را وصل کنید و سپس از <b>Settings → Telegram</b> بارکد را اسکن کنید.",
  "guest.cta": "برای شروع از دکمه‌های پایین استفاده کنید 👇",
  "guest.webPrompt": "🌐 شروع از طریق سایت:",
  "quick": "لینک‌های سریع 👇",

  "how.title": "ℹ️ <b>نحوه کار</b>",
  "how.s1": "<b>۱.</b> در سایت ثبت‌نام کنید و حساب گیت‌هاب را وصل کنید.",
  "how.s2": "<b>۲.</b> انتخاب کنید کدام ریپوها و کدام نوع رویدادها مانیتور شوند.",
  "how.s3": "<b>۳.</b> به <b>Settings → Telegram</b> بروید، بارکد را اسکن کنید (یا روی لینک بزنید) و اینجا <b>Start</b> را بزنید.",
  "how.s4": "<b>۴.</b> هر رویداد هم در داشبورد ثبت می‌شود <i>و</i> هم همان لحظه به این چت می‌آید.",
  "how.foot": "🔒 هر زمان بخواهید می‌توانید اعلان‌ها را متوقف کنید یا اتصال را قطع کنید — از سایت یا با /stop.",

  "guestProfile.title": "👤 <b>پروفایل</b>",
  "guestProfile.status": "🔴 <b>وضعیت:</b> متصل نیست",
  "guestProfile.body": "این چت هنوز به حساب GitHub Monitor وصل نشده است. در سایت وارد شوید و از <b>Settings → Telegram</b> این چت را متصل کنید.",

  "connect.title": "🔗 <b>اتصال به گیت‌هاب</b>",
  "connect.body": "سایت را باز کنید، وارد شوید و GitHub App را روی حساب خود نصب کنید. سپس ریپوهایی را که می‌خواهید مانیتور شوند انتخاب کنید.",
  "connect.tap": "👇 روی دکمه زیر بزنید.",

  "member.welcomeBack": "👋 خوش برگشتی{name}!",
  "member.connected": "✅ این چت متصل است. همه رویدادهای ریپوهای مانیتورشده را همین‌جا دریافت می‌کنید.",
  "member.useMenu": "از منوی پایین استفاده کنید یا /help را بفرستید.",

  "linked.title": "✅ <b>متصل شد!</b>",
  "linked.body": "سلام{name}، این چت اکنون به حساب GitHub Monitor شما وصل است.",
  "linked.foot": "از این پس هر اتفاقی در ریپوهای مانیتورشده بیفتد، همان لحظه اینجا پیام می‌گیرید.",
  "linked.try": "📊 از منوی پایین، <b>آمار</b> یا <b>فعالیت‌های اخیر</b> را امتحان کنید.",

  "profile.title": "👤 <b>پروفایل</b>",
  "profile.status": "🟢 <b>وضعیت:</b> متصل",
  "profile.name": "🙍 <b>نام:</b> {v}",
  "profile.email": "✉️ <b>ایمیل:</b> {v}",
  "profile.github": "🐙 <b>گیت‌هاب:</b> {v}",
  "profile.githubNone": "هنوز متصل نشده",
  "profile.notifications": "🔔 <b>اعلان‌ها:</b> {v}",
  "profile.since": "📅 <b>متصل از:</b> {v}",
  "profile.groups": "👥 <b>گروه/کانال‌ها:</b> {v}",
  "profile.overview": "<b>خلاصه</b>",
  "profile.repos": "📁 ریپوزیتوری‌ها: {a}  ·  👁 مانیتورشده: {b}",
  "profile.events": "⚡ رویدادهای امروز: {a}  ·  🗂 کل: {b}",
  "on": "روشن",
  "off": "خاموش",

  "stats.title": "📊 <b>آمار — {range}</b>",
  "stats.today": "امروز",
  "stats.7d": "۷ روز گذشته",
  "stats.30d": "۳۰ روز گذشته",
  "stats.commits": "🔨 کامیت: <b>{n}</b>",
  "stats.stars": "⭐ استار: <b>{n}</b>",
  "stats.forks": "🍴 فورک: <b>{n}</b>",
  "stats.prs": "🔀 پول‌ریکوئست: <b>{n}</b>",
  "stats.issues": "🐛 ایشو: <b>{n}</b>",
  "stats.releases": "🚀 ریلیز: <b>{n}</b>",
  "stats.total": "Σ مجموع: <b>{n}</b>",

  "activity.title": "🕒 <b>فعالیت‌های اخیر</b>",
  "activity.empty": "هنوز رویدادی ثبت نشده. به‌محض اینکه اتفاقی بیفتد اینجا نمایش داده می‌شود.",

  "repos.title": "📁 <b>ریپوهای مانیتورشده</b> ({n})",
  "repos.empty": "هنوز هیچ ریپویی را مانیتور نمی‌کنید. از صفحه Repositories در سایت مانیتورینگ را فعال کنید.",

  "top.title": "🏆 <b>برترین‌های این هفته</b>",
  "top.repos": "<b>⭐ پرستاره‌ترین ریپوها</b>",
  "top.active": "<b>🔥 فعال‌ترین ریپوها (۷ روز)</b>",
  "top.actors": "<b>🧑‍💻 فعال‌ترین مشارکت‌کنندگان (۷ روز)</b>",
  "top.events": "{n} رویداد",
  "top.empty": "هنوز چیزی برای رتبه‌بندی نیست — فعالیت‌ها اینجا نمایش داده می‌شوند.",

  "notif.title": "🔔 <b>اعلان‌ها</b>",
  "notif.current": "وضعیت فعلی: <b>{v}</b>",
  "notif.onText": "همه رویدادهای ریپوهای مانیتورشده برایتان ارسال می‌شود.",
  "notif.offText": "رویدادها همچنان در داشبورد ثبت می‌شوند، اما چیزی اینجا ارسال نمی‌شود.",
  "notif.toastOn": "اعلان‌ها روشن شد",
  "notif.toastOff": "اعلان‌ها متوقف شد",

  "help.title": "❓ <b>راهنما</b>",
  "help.commands": "<b>دستورات</b>",
  "help.start": "/start — منوی اصلی",
  "help.profile": "/profile — حساب شما",
  "help.stats": "/stats — آمار رویدادها",
  "help.activity": "/activity — آخرین رویدادها",
  "help.repos": "/repos — ریپوهای مانیتورشده",
  "help.top": "/top — برترین‌های هفته",
  "help.notifications": "/notifications — توقف / ادامه اعلان‌ها",
  "help.language": "/language — تغییر زبان",
  "help.connect": "/connect — نحوه اتصال به گیت‌هاب",
  "help.stop": "/stop — قطع اتصال این چت",
  "help.help": "/help — همین پیام",

  "lang.title": "🌐 <b>زبان</b>",
  "lang.body": "زبان پیام‌های ربات را انتخاب کنید:",
  "lang.changed": "زبان روی فارسی تنظیم شد 🇮🇷",

  "need.member": "🔒 این بخش به حساب متصل نیاز دارد. در سایت به <b>Settings → Telegram</b> بروید و این چت را متصل کنید.",
  "unknown": "متوجه نشدم 🤔 از منوی پایین استفاده کنید یا /help را بفرستید.",
  "err.inUse": "⚠️ این حساب تلگرام قبلاً به کاربر دیگری در GitHub Monitor وصل شده است. اول /stop را بفرستید و دوباره تلاش کنید.",
  "err.badLink": "❌ این لینک نامعتبر است یا منقضی شده. از <b>Settings → Telegram</b> لینک جدید بسازید.",
  "stop.done": "🔌 <b>قطع شد.</b> دیگر اعلانی دریافت نخواهید کرد.\nبرای راه‌اندازی دوباره، هر زمان /start را بفرستید.",
  "stop.none": "این چت متصل نیست.",
  "toast.notConnected": "متصل نیست",

  "group.linked": "✅ <b>گروه متصل شد!</b>\nاین چت از این پس اعلان‌های GitHub Monitor را دریافت می‌کند. برای قطع اتصال، ادمین‌ها می‌توانند /stop را بفرستند.",
  "group.badLink": "❌ این لینک نامعتبر است یا منقضی شده. از <b>Settings → Telegram</b> لینک جدید بسازید.",
  "group.stopped": "🔌 اتصال این چت با GitHub Monitor قطع شد.",
  "group.adminOnly": "فقط ادمین‌های گروه می‌توانند این کار را انجام دهند.",
  "group.notLinked": "این چت به GitHub Monitor وصل نیست.",
  "group.status": "✅ این چت متصل است و اعلان‌ها را دریافت می‌کند.",
} as const satisfies Record<MessageKey, string>;

const TABLES: Record<Lang, Record<MessageKey, string>> = { en, fa };

export function t(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = TABLES[lang][key] ?? en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}

/** Maps Telegram's `language_code` to a supported language. */
export function langFromCode(code?: string | null): Lang {
  return code?.toLowerCase().startsWith("fa") ? "fa" : "en";
}

/** Finds which button key a tapped reply-keyboard label belongs to (any language). */
export function matchButton(text: string): MessageKey | null {
  for (const lang of LANGS) {
    for (const key of Object.keys(TABLES[lang]) as MessageKey[]) {
      if (key.startsWith("btn.") && TABLES[lang][key] === text) return key;
    }
  }
  return null;
}

/** Persian translations of the English event labels from getEventDisplay(). */
const FA_EVENT_LABELS: Record<string, string> = {
  "New Commit": "کامیت جدید",
  "New Star": "ستاره جدید",
  "New Fork": "فورک جدید",
  "Pull Request Merged": "پول‌ریکوئست مرج شد",
  "Pull Request Closed": "پول‌ریکوئست بسته شد",
  "Pull Request Reopened": "پول‌ریکوئست دوباره باز شد",
  "Review Requested": "درخواست بازبینی",
  "New Pull Request": "پول‌ریکوئست جدید",
  "Pull Request Review": "بازبینی پول‌ریکوئست",
  "Issue Closed": "ایشو بسته شد",
  "Issue Reopened": "ایشو دوباره باز شد",
  "Issue Assigned": "ایشو اختصاص یافت",
  "Issue Labeled": "برچسب ایشو",
  "New Issue": "ایشو جدید",
  "New Comment": "کامنت جدید",
  "New Release": "ریلیز جدید",
  "Branch Created": "شاخه ساخته شد",
  "Branch Deleted": "شاخه حذف شد",
  "Workflow Failed": "ورک‌فلو ناموفق",
  "Workflow Cancelled": "ورک‌فلو لغو شد",
  "Workflow Started": "ورک‌فلو شروع شد",
  "Workflow Succeeded": "ورک‌فلو موفق",
  "Deployment Failed": "دیپلوی ناموفق",
  Deployment: "دیپلوی",
  "New Follower": "فالوور جدید",
  Unfollow: "آنفالو",
  "Star Removed": "ستاره حذف شد",
};

export function translateEventLabel(lang: Lang, englishLabel: string): string {
  return lang === "fa" ? (FA_EVENT_LABELS[englishLabel] ?? englishLabel) : englishLabel;
}
