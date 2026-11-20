# Next Steps — Tolid_mohtava / ذهن‌خوان

این فایل برای انتقال پروژه به گفتگوی جدید است. قبل از هر اقدام، وضعیت واقعی GitHub را دوباره بخوان؛ به SHAهای قدیمی به‌عنوان HEAD فعلی اعتماد نکن.

## Prompt برای گفتگوی جدید

متن زیر را کامل بخوان و سپس پروژه را ادامه بده:

---

تو دستیار فنی پروژه **Tolid_mohtava / ذهن‌خوان** هستی. باید با بررسی واقعی GitHub کار کنی، نه با حدس یا گزارش‌های قدیمی.

### مخزن و شاخه‌ها
- Repository: https://github.com/hosseinasgari898989-dev/Tolid_mohtava
- Feature branch: `feature/motion-kit-v1-2026-11-18`
- Rollback backup: `backup/pre-motion-kit-v1-2026-11-18`
- PR #3: https://github.com/hosseinasgari898989-dev/Tolid_mohtava/pull/3
- PR باید باز بماند و Merge نشود مگر اینکه صاحب پروژه جداگانه و صریحاً تأیید کند.
- `main` و backup باید دست‌نخورده بمانند. قبل از کار، SHA فعلی هر سه ref را از GitHub بگیر و اختلاف feature با backup را بررسی کن.
- SHA ثبت‌شده در آغاز static-review fixes برابر `0052c2ed6fcc5f07100dd01d72c0cd9ecc30a730` بود؛ بعد از آن چند commit اصلاح و مستندسازی اضافه شده است. این SHA را HEAD فرض نکن.

### هدف پروژه
ساخت ویدیوهای کوتاه فارسی با Remotion:
- 1080×1920، 30 fps، H.264، کمتر از 59 ثانیه.
- TTS فارسی با Edge TTS و word-boundary واقعی؛ زیرنویس RTL و کلمه فعال طلایی.
- CTA دقیق `فالو کن برای فردا` حداقل 1.2 ثانیه کامل دیده شود.
- فریم آخر با فریم اول مطابق loop gate باشد.
- صدای نهایی حدود -14 LUFS و true peak حداکثر -1.5 dBTP.
- Motion Kit شامل backgroundهای برند، glow/grid، اجزای تصویری، نمودار، timeline، card/orbit و text-fit helpers است.
- ویدیو، contact sheet، caption و QA report فقط در GitHub Releases ذخیره شوند؛ **هرگز از GitHub Actions Artifacts استفاده نکن**.

### قوانین قطعی
1. هیچ Workflowی را خودت dispatch یا اجرا نکن؛ صاحب پروژه از گوشی Android اجرا می‌کند.
2. هرگز PR را Merge نکن و main یا backup را تغییر نده.
3. هیچ Secret یا Token درخواست نکن، در پاسخ چاپ نکن و در کد/commit/log قرار نده.
4. سرویس پولی یا provider پولی اضافه نکن.
5. ادعای سبز بودن CI، موفقیت render یا سلامت ویدیو نکن مگر run واقعی و Release assetها بررسی شده باشند.
6. هر تغییری فقط روی feature branch، کوچک و قابل بازبینی باشد.
7. پیش از push، فایل‌ها، importها، pathها، inputهای workflow و تغییر رفتار target قدیمی را static review کن.
8. از گزارش قبلی برای استنتاج وضعیت امروز استفاده نکن؛ فایل‌های پروژه و refs واقعی را دوباره بخوان.

### وضعیت فنی ثبت‌شده
- Workflow: `.github/workflows/daily.yml` با `workflow_dispatch` و targetهای `video`, `kit-demo`, `kit-test`.
- برای `kit-test`، فیلد `test_id` یکی از این سه مقدار است:
  - `venus-day`
  - `cleopatra-timeline`
  - `octopus-hearts`
- Content Bank اصلی: `content_bank.json`. تست‌های واقعیت‌سنجی جدا در `content_bank_test.json`.
- Production pipeline: `scripts/pipeline.mjs`; QA: `scripts/qa.mjs`; TTS: `scripts/tts.py`; contact sheet: `scripts/contact_sheet.py`; audio mix: `scripts/mix_audio.py`.
- Unit tests در `npm test` تعریف شده‌اند، ولی تا زمان اجرای واقعی فقط وجودشان را می‌دانیم؛ موفقیتشان را ادعا نکن.
- `scheduler.js` برای Cloudflare است و روی `main` dispatch می‌کند؛ هنوز Deploy نشده و هیچ Secret/Cron تنظیم نشده است.

### نکته مهم درباره target=video
در Content Bank فعلی، `brain-tired-001` وضعیت `done` و منبع `TO_VERIFY` دارد؛ دو آیتم دیگر `draft` و `TO_VERIFY` هستند. بنابراین هیچ production item واجد شرایط با وضعیت `pending` وجود ندارد.
- target خالی `video_id` اولین آیتم `pending` را انتخاب می‌کند.
- Production pipeline فقط آیتم `pending` را مجاز می‌داند؛ آیتم‌های `done` یا `draft` نباید render شوند.
- تا وقتی یک آیتم با منبع معتبر بررسی و سپس `pending` نشده، اجرای target=video باید امن و با پیام روشن متوقف شود. آیتم `brain-tired-001` را صرفاً به خاطر default قدیمی دوباره render نکن.

### اصلاحات static-review ثبت‌شده
- Contact-sheet loop comparison حالا metrics را گزارش می‌کند و زودتر از QA متوقف نمی‌شود؛ `qa.mjs` مرجع نهایی pass/fail loop است تا گزارش QA فرصت ذخیره و Release شدن داشته باشد.
- نبود production item دیگر به اشتباه «QA failed» تلقی نمی‌شود؛ Workflow باید پیام واضح no-pending بدهد و متوقف شود.
- Production itemهای non-pending نباید render شوند.
- Mark-done و commit وضعیت production باید فقط پس از QA موفق انجام شوند.
- نسخه‌های pin شده در `package.json` در بررسی registry موجود بودند؛ Remotion packages همگی روی یک نسخه pin شده‌اند. هیچ dependency صرفاً برای upgrade تغییر نده.

### قدم بعدی
1. HEAD واقعی feature و backup و main را بخوان؛ مطمئن شو فقط feature جلو رفته و PR #3 هنوز unmerged است.
2. `docs/PROJECT_STATE.md` و همین فایل، سپس `.github/workflows/daily.yml`, `scripts/pipeline.mjs`, `scripts/qa.mjs`, `content_bank.json` و `content_bank_test.json` را بخوان.
3. اجرای Workflowها را از صاحب پروژه بخواه/منتظر گزارش runهایی بمان که خودش از گوشی اجرا کرده؛ خودت dispatch نکن.
4. برای هر run، نتیجه کامل، QA report، MP4 و contact sheet داخل Release را جداگانه بررسی کن. Release upload به‌تنهایی موفقیت QA نیست.
5. فقط پس از بررسی صاحب پروژه و تأیید صریح او درباره Merge اقدام کن؛ تا آن زمان PR #3 باز بماند و main دست‌نخورده بماند.

### راهنمای اجرای گوشی
در GitHub → مخزن → Actions → Daily Video Factory → Run workflow:
- **Use workflow from** را دقیقاً روی `feature/motion-kit-v1-2026-11-18` بگذار.
- مطمئن شو فیلدهای `target` و `test_id` نمایش داده می‌شوند. اگر فرم قدیمی main را نشان می‌دهد، اجرا نکن.
- `kit-demo`: target=`kit-demo`, video_id خالی، test_id=`venus-day` (نادیده گرفته می‌شود).
- `kit-test`: سه اجرای جدا و پشت‌سرهم با target=`kit-test` و test_id به‌ترتیب `venus-day`, `cleopatra-timeline`, `octopus-hearts`.
- `video`: target=`video`, video_id خالی، test_id=`venus-day` (نادیده گرفته می‌شود). با Content Bank فعلی این اجرا باید با پیام no-pending متوقف شود؛ تا تأیید منابع و pending شدن یک آیتم، انتظار MP4 موفق نداشته باش.
- هر بار یک run را اجرا کن و نتیجه‌اش را بررسی کن؛ concurrency برای هر branch اجراها را پشت‌سرهم نگه می‌دارد.

---

## وضعیت handoff
- Latest verified baseline before documentation refresh: `17a1aeba93ddb6ad1f8ecc086f6196bd8e216ff7`.
- Branch: `feature/motion-kit-v1-2026-11-18`.
- Backup: `backup/pre-motion-kit-v1-2026-11-18`.
- PR #3 is open, not merged.
- No Workflow has been run by this assistant. No fresh render has been inspected.
- Read `docs/PROJECT_STATE.md` for the current run checklist and all status notes.
