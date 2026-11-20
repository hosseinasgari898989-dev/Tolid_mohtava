# راه‌اندازی Cloudflare Scheduler از گوشی Android

این راهنما فقط برای آماده‌سازی دستی است. در این تغییر هیچ Workerای Deploy نشده و هیچ Secretی از شما در گفتگو خواسته نمی‌شود.

## ۱) ساخت GitHub Fine-grained token

این Token فقط برای اجرای دستی Workflow از Cloudflare لازم است. چون درخواست API فقط Workflow Dispatch است، حداقل دسترسی لازم برای آن **Actions: Write** است؛ خواندن عمومی GitHub به‌طور پیش‌فرض محدودیت Token را دور نمی‌زند. دسترسی Token را به همین Repository محدود کنید.

1. در Chrome گوشی، وارد حساب GitHub شوید و این صفحه را باز کنید:
   https://github.com/settings/personal-access-tokens
2. روی **Fine-grained tokens** بزنید.
3. **Generate new token** را انتخاب کنید.
4. در **Token name** بنویسید: `Tolid_mohtava Cloudflare Scheduler`
5. برای **Expiration** یک تاریخ انقضا انتخاب کنید؛ Token بدون انقضا پیشنهاد نمی‌شود.
6. در **Resource owner** حساب `hosseinasgari898989-dev` را انتخاب کنید.
7. در **Repository access** گزینه **Only select repositories** را بزنید.
8. از فهرست فقط Repository با نام `Tolid_mohtava` را انتخاب کنید.
9. در بخش **Repository permissions** فقط این مجوز را تنظیم کنید:
   - **Actions → Read and write**
10. **Contents** را روی No access بگذارید. برای این عملیات نیازی به Contents write یا Administration نیست.
11. گزینه **Generate token** را بزنید.
12. Token فقط یک بار کامل نمایش داده می‌شود. آن را کپی کنید و همان‌جا در Cloudflare به‌عنوان Secret ذخیره کنید. داخل ChatGPT، پیام، Issue، فایل یا کد عمومی Paste نکنید.

اگر Repository در فهرست نمایش داده نشد یا Token در حالت Pending ماند، ادامه ندهید؛ احتمالاً Resource owner یا سیاست دسترسی Repository نیاز به بررسی دارد.

## ۲) باز کردن Worker در Cloudflare

1. در Chrome به https://dash.cloudflare.com بروید و وارد حساب خود شوید.
2. از صفحه اصلی **Workers & Pages** را باز کنید.
3. Worker مربوط به Scheduler را انتخاب کنید. اگر هنوز Worker نساخته‌اید، این مرحله را متوقف کنید تا نام و مقصد Worker را قبل از ساخت مشخص کنید.
4. به تب **Edit code** بروید.
5. فایل فعلی Worker را باز کنید. کد آماده در Repository در فایل `scheduler.js` است:
   https://github.com/hosseinasgari898989-dev/Tolid_mohtava/blob/feature/motion-kit-v1-2026-11-18/scheduler.js
6. پس از تأیید نهایی و Merge شدن PR، نسخه نهایی همین فایل را از شاخه `main` بردارید. فعلاً PR را Merge نکنید و Worker را Deploy نکنید.
7. کد Worker را جایگزین نسخه قبلی کنید. قبل از Deploy، مطمئن شوید کد کامل ذخیره شده و فایل از ابتدا تا انتها Paste شده است.

## ۳) افزودن Secrets به Worker

1. در صفحه Worker، **Settings** را باز کنید.
2. وارد **Variables and Secrets** شوید.
3. در قسمت **Secrets**، گزینه افزودن Secret را بزنید.
4. نام Secret اول را دقیقاً `GITHUB_PAT` قرار دهید.
5. Token ساخته‌شده در مرحله اول را مستقیماً در فیلد Value قرار دهید.
6. ذخیره کنید.
7. Secret دوم را با نام دقیق `MANUAL_TRIGGER_KEY` اضافه کنید.
8. برای مقدار آن یک رشته تصادفی و طولانی (حداقل ۳۲ کاراکتر) در Password Manager گوشی بسازید. این مقدار را در چت یا Repository ننویسید.
9. ذخیره کنید. هر دو مقدار باید از نوع **Secret** باشند، نه Text Variable.

نام‌ها به بزرگی و کوچکی حروف حساس‌اند. مقدار Secretها نباید در کد، Log یا پاسخ HTTP بازگردانده شود.

## ۴) تنظیم Cron Trigger

1. در همان Worker به **Settings → Triggers** بروید.
2. بخش **Cron Triggers** را پیدا کنید.
3. روی **Add Cron Trigger** بزنید.
4. یک Cron expression پنج‌قسمتی وارد کنید. نمونه زیر فقط نمونه است، نه زمان‌بندی از پیش تأییدشده:
   `0 9 * * *`
5. این نمونه یعنی هر روز ساعت 09:00 بر مبنای UTC اجرا شود.
6. Cron را ذخیره کنید. تغییر Cron ممکن است تا حدود ۱۵ دقیقه برای انتشار در شبکه Cloudflare زمان بخواهد.
7. زمان موردنظر خودتان را قبل از ذخیره انتخاب کنید. ساعت Cron بر اساس UTC است و با تغییر ساعت تابستانی/زمستانی آلمان، ساعت محلی متناظر هم تغییر می‌کند.

## ۵) تست دستی و رفتار مورد انتظار

- Trigger زمان‌بندی‌شده، تابع `scheduled()` را صدا می‌زند و Workflow را روی شاخه `main` Dispatch می‌کند.
- Trigger دستی فقط مسیر `POST /trigger` را می‌پذیرد.
- برای Trigger دستی، کلید باید فقط در Header با نام `x-trigger-key` ارسال شود. آن را در URL یا Query String قرار ندهید.
- درخواست بدون کلید یا با کلید اشتباه باید پاسخ `401` بگیرد.
- درخواست به مسیر دیگر باید `404` بگیرد و متد غیر از POST باید `405` دریافت کند.
- Token نامعتبر یا بدون مجوز Actions write باید به خطای Dispatch منجر شود؛ Secret را در Log چاپ نکنید.
- Dispatch موفق فقط یعنی GitHub درخواست اجرای Workflow را پذیرفته است، نه اینکه ویدیو با موفقیت Render شده است. نتیجه واقعی باید از صفحه Actions بررسی شود.

## ۶) موارد امنیتی و توقف

- هیچ Secretی را در چت، GitHub Issues، Commit، README یا Log ننویسید.
- Token فقط برای همین Repository و Actions write باشد.
- Token را با افراد دیگر به اشتراک نگذارید و اگر افشا شد، از تنظیمات GitHub آن را Revoke کنید.
- اگر Cron ناخواسته چند بار اجرا شد، Trigger را از Cloudflare موقتاً حذف یا غیرفعال کنید.
- تا وقتی PR تأیید و Merge نشده و خودتان کد و Releaseها را بررسی نکرده‌اید، Scheduler را Deploy نکنید.

## منابع رسمی

- GitHub: ساخت Fine-grained personal access token و انتخاب Repository/Permissions:
  https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- GitHub: مجوز موردنیاز برای Create a workflow dispatch event:
  https://docs.github.com/en/rest/actions/workflows
- Cloudflare: افزودن Cron Trigger از Dashboard و UTC بودن زمان اجرا:
  https://developers.cloudflare.com/workers/configuration/cron-triggers/
