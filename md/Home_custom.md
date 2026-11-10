# Home Page Customization Guide

Golpahar Mohashoshan Kali Mandir · Admin guide for the home page

This guide explains what can be changed on the home page from the admin panel, and how to change it. It describes the planned behavior, so screen names may differ slightly once built.

## 1. The idea

The home page is made of **sections**. Each section has its own content, and the admin panel lets you change that content, switch sections on or off, and put them in any order. No code change or developer is needed for any of it.

There are three kinds of content:

- **Text blocks:** the hero, the donation call-to-action, section headings, footer and contact details.
- **Lists:** the daily schedule, pujas and charges, deities, events and festivals, notices. Each item is added, edited, hidden or reordered on its own screen.
- **Look and structure:** which sections appear, in what order, with which layout and design, and the site colors, font and shape.

## 2. What you can customize

### Home page controls

These are set in the Home Builder and the Theme screen. They change how the home page looks, never what is inside the modules below.

| Control | What you choose | Where | Who |
| --- | --- | --- | --- |
| Show or hide | Turn any section on or off | Home Builder | Admin, editor |
| Order | Drag sections into any order | Home Builder | Admin, editor |
| Layout | Pick a layout per section: schedule as timeline, cards or compact list; deities as carousel or grid; pujas as list or cards; festivals and notices side by side or stacked | Home Builder → Design | Admin |
| Section design | Background (plain, tinted, dark, image), width (narrow, normal, wide), alignment, spacing, show or hide the heading, how many items to show | Home Builder → Design | Admin |
| Section text | Heading, subtitle, buttons (label and link), hero image, donation section text, announcement bar (on or off, message, link, end date) | Home Builder → Content | Admin, editor |
| Colors | A theme preset plus custom colors | Theme | Admin |
| Typography and shape | Font from a short list, corner roundness, card style | Theme | Admin |

### Independent modules

Each module has its own admin page. You manage its items there, and every place that shows them updates, including the home page.

| Module | What you manage | Where |
| --- | --- | --- |
| Daily schedule | Times, names and descriptions of each aarti and puja; add, hide or reorder items | Content → Schedule |
| Pujas and charges | Name, offerings, price, duration, whether it can be booked | Content → Pujas |
| Calendar, events and festivals | Date, type (special puja, festival, seva), title, time, description. The home page festival list shows events of type festival | Content → Events |
| Deities | Name, subtitle, description, photo, order in the carousel | Content → Deities |
| Notices | Title, date, category, body; pin an important notice | Content → Notices |
| Bookings, messages, volunteers | Puja booking requests, contact messages and volunteer sign-ups (admin only, not shown on the site) | Admin → Requests |
| Media library | Uploaded images and their descriptions | Admin → Media |

### Site-wide settings

| Setting | What you change | Where |
| --- | --- | --- |
| Footer and contact | Address, phone, office email, social links | Settings |
| Logo and site name | Temple name, tagline, logo | Settings |

The **Next aarti** badge on the hero is calculated automatically from the daily schedule. You never type it in.

## 3. How to customize the home page

### Log in

1. Open the admin login page and sign in with your admin or editor account.
2. You land on the admin overview. The menu shows only the screens your role can use.

### Reorder or hide sections

1. Open **Home Builder**.
2. Drag a section to a new position, or use the up and down buttons.
3. Use the toggle to hide or show a section. A hidden section keeps its content and can be shown again at any time.
4. Press **Save**. The public page updates within a few seconds.

### Choose a layout and design

1. Open **Home Builder** and press **Design** on a section (admin only).
2. Pick a **layout** from the previews. For example, the schedule can be a timeline, cards or a compact list.
3. Set the section design: background (plain, tinted, dark or image), width, alignment, spacing, whether the heading shows, and how many items to display.
4. Check the preview, then press **Save**. Press **Reset to default** to undo your changes.

### Edit the text of a section

1. In **Home Builder**, press **Edit** on the section.
2. Each text field has two tabs: **English** and **বাংলা**. English is required. If the Bengali tab is empty, visitors see the English text.
3. Change the text, then press **Save**.
4. Buttons have a label and a link. A link can be a page on this site (for example `/puja-list-and-charges`) or a full `https://` address.

### Change an image

1. In the section form, press **Choose image**.
2. Pick an image from the **Media library**, or upload a new one (JPEG, PNG or WebP, up to 5 MB).
3. Add a short description of the image in English and Bengali. It helps visitors who use screen readers.
4. Press **Save**.

### Use the announcement bar

1. Open **Home Builder → Announcement**.
2. Turn it on, write the message in both languages, and add an optional link.
3. Set an end date if it should switch off by itself, for example after an Ekadashi.

### Change the colors, font and shape

1. Open **Theme** (admin only).
2. Pick a preset, then adjust the main colors if you wish. Choose a font, corner roundness and card style. A preview shows the result as you choose.
3. If the text would be hard to read on a color, you will see a warning. Pick a stronger contrast.
4. Press **Save**, or **Reset to default** to go back to the original saffron and maroon palette.

## 4. Independent modules and site settings

Each module has its own admin page, under the Content menu. You manage its items there, and every place that shows them updates, including the home page. The Home Builder only decides how a module is shown, never what is in it.

### Manage a list (schedule, pujas, deities, events, notices)

1. Open the list from the **Content** menu.
2. Press **Add** to create an item, or open an existing one to edit it.
3. Use **Active** to hide an item without deleting it. Hidden items never appear on the public site.
4. Where order matters (schedule, pujas, deities), drag items into the order you want.
5. Press **Save**.

For festivals, enter the calendar date each year, because lunar festival dates move. You can add a label such as the tithi or the Bengali date.

### Change site settings and footer

1. Open **Settings** (admin only).
2. Update the temple name, tagline, logo, address, phone, office email and social links.
3. Press **Save**.

## 5. Rules for content

- **Plain text only.** No HTML. Line breaks are allowed.
- **Links** must start with `/` (a page on this site) or `https://`. Anything else is rejected.
- **English is required** for every text. Bengali is optional and falls back to English.
- **Keep headings short.** Long headings can wrap badly on phones.
- **Images** should be clear and not too large. They are resized automatically, but a good original gives the best result.
- **Do not delete** an image that is still used. The system will refuse and tell you where it is used.

## 6. Who can do what

| Task | Admin | Editor |
| --- | --- | --- |
| Edit text, images, lists | Yes | Yes |
| Reorder or hide sections | Yes | Yes |
| Site settings and footer | Yes | No |
| Theme colors | Yes | No |
| Users and roles | Yes | No |
| View bookings and messages | Yes | No |
| Layout, section design, fonts | Yes | No |

Registered devotee accounts (role **user**) cannot open the admin panel.

## 7. What you cannot change

To keep the site reliable and fast, the following stay fixed:

- Free-form layout. You choose from ready-made layouts for each section, you cannot draw a new one.
- New kinds of sections or new layouts. A developer adds those, and they then appear in the Design options.
- Fonts outside the short list on the Theme screen.

If you need one of these, ask the developer. It is a code change, not an admin setting.

## 8. After you save

- The change is checked first. If something is wrong (for example a bad link), you see a clear message and nothing is changed.
- The public page refreshes automatically within a few seconds.
- Every change is recorded in the activity log, with who made it and when (admin only).
- If a change does not appear, refresh the page once. If it still does not appear, wait a minute and try again, then contact the developer.

## 9. Quick checklist before a festival

1. Add or update the festival in **Events** (date, time, description).
2. Add a **Notice** with special timings and pin it.
3. Turn on the **Announcement bar** with an end date.
4. Update the **Schedule** if daily timings change.
5. Open the public home page on a phone and check both English and Bengali.
