# Portfolio — محمد نبيل

**الرابط العام:** https://modealex6.github.io/portfolio/ (GitHub Pages، المستودع `modealex6/portfolio`)

موقع شخصي بصفحة واحدة: عربي RTL افتراضيًا مع تبديل كامل للإنجليزية. HTML + CSS + JavaScript بلا أي إطار عمل أو خدمة خارجية، وبلا خطوة بناء.

## التشغيل
افتح `index.html` مباشرة، أو شغّل خادمًا محليًا (أفضل — بعض المتصفحات تمنع `localStorage` على `file://`):

```powershell
cd portfolio
python -m http.server 4173
# http://127.0.0.1:4173
```

## الملفات
```
index.html                  ← كل نص عربي موجود هنا (المصدر الأساسي)
assets/css/style.css        ← نظام التصميم كامل (ملف واحد لـ RTL و LTR)
assets/js/main.js           ← اللغة، القائمة، الـ canvas، الميلان، الكشف، الساعة
content/en.js               ← كل نص إنجليزي في مكان واحد
assets/fonts/               ← Alexandria + IBM Plex Sans Arabic + JetBrains Mono (woff2)
assets/img/favicon.svg
robots.txt
brief.md  design.md  launch-checklist.md
```

## كيف تعدّل المحتوى

**نص عربي:** عدّل النص داخل `index.html` مباشرة. كل عنصر نصي عليه `data-i18n="مفتاح"` — المفتاح هو ما يربطه بالترجمة.

**نص إنجليزي:** عدّل القيمة المقابلة للمفتاح نفسه في `content/en.js`. المفتاح الناقص لا يكسر شيئًا: يبقى النص العربي.

**مشروع:** كل مشروع `<article class="work work--…">` وله تخطيط داخلي مختلف. عند إضافة مشروع:
1. اختر الشكل: `work--panel` (قائمة + مسار)، `work--split` (أعمدة توازن)، `work--constellation` (شبكة SVG)، `work--pipeline` (خط أنابيب)، `work--marquee` (شريط متحرك)، `work--dossier` (ملف).
2. `data-status` → `done` / `progress` / `experimental` / `planning`، وغيّر نص الحالة وكلاسها (`status--done` …) معه.
3. العرض في الشبكة يأتي من الكلاس نفسه (`grid-column: span 7/5/12`) — لا تحتاج تعديل CSS.
4. أضف مفاتيح الترجمة في `content/en.js` بنفس المسار (`work.<id>.<key>`).

**خبرة أو تعليم:** انسخ صف `<li class="log-row">` أو `<li>` داخل `ul.edu` وعدّله.

**البريد والروابط:** `data-copy="…"` على زر النسخ، و`href="mailto:…"` على الرابط — غيّرهما معًا.

## اللغة
العربية هي HTML الحقيقي (تعمل بلا جافاسكربت وتُفهرس). عند اختيار English تُستبدل النصوص من `content/en.js`، ويتغيّر `lang` و`dir` إلى `en`/`ltr`، ويُحفظ الاختيار في `localStorage` (`mn-portfolio-lang`). يمكن فرض اللغة من الرابط: `?lang=en` أو `?lang=ar` (مفيد للمشاركة).

## العناصر المؤقتة قبل «الاكتمال»
- [ ] الصورة الشخصية: الإطار البديل `MN` بنسبة 4:5 — استبدله بـ`<img src="assets/img/profile.jpg" alt="محمد نبيل" width="800" height="1000">` داخل `.portrait-frame`.
- [ ] LinkedIn والسيرة الذاتية: حاليًا «قيد الإضافة» (بحدود متقطّعة) — حوّلهما إلى روابط عند توفّرهما.
- [ ] حالة كل مشروع: تأكد أنها تعكس الواقع (`data-status` + نص الحالة في اللغتين).
- [ ] `og:image` عند النشر.

## النشر (تم)
الموقع منشور على GitHub Pages من هذا المستودع نفسه (`modealex6/portfolio`، فرع `main`، جذر المستودع):
**https://modealex6.github.io/portfolio/**

```powershell
cd portfolio
git add .
git commit -m "…"
git push
```
كل دفعة إلى `main` تُعيد النشر تلقائيًا خلال دقيقة تقريبًا.

بدائل: Cloudflare Pages أو Netlify — اسحب المجلد كما هو.

## الفحص
راجع `launch-checklist.md`: جدول نتائج الفحص الفعلي، وما لم يُفحص بعد.
