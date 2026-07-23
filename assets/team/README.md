# Team photos

Drop each member's photo here using the **exact filename** below.
Until a file exists, the card automatically shows the gradient circle with the person's initial (no broken image).

| Filename          | Person      | Role              |
| ----------------- | ----------- | ----------------- |
| `vladislav.jpg`   | Владислав   | Дизайнер          |
| `andrey.jpg`      | Андрей      | CEO               |
| `nikita.jpg`      | Никита      | Маркетолог / HR   |
| `pavel.jpg`       | Павел       | Backend developer |
| `prohor.jpg`      | Прохор      | Frontend developer|
| `stanislav.jpg`   | Станислав   | C++ developer     |
| `ivan.jpg`        | Иван        | Специалист SMM    |

## Requirements

- **Shape:** square (1:1). It is cropped into a circle via `object-fit: cover`.
- **Size:** 400×400 px is enough (avatars render at 56 px). 800×800 for retina.
- **Format:** `.jpg` (or `.webp` — then also change the `src` extension in `index.html`).
- **Weight:** keep each under ~150 KB.

## How the fallback works

In `index.html` each avatar is:

```html
<div class="team-avatar" style="--avatar-bg: ...">
  <img class="team-avatar__img" src="./assets/team/NAME.jpg" alt="Имя" onerror="this.remove()" />
  <span class="team-avatar__fallback">Буква</span>
</div>
```

If the image is missing/broken, `onerror` removes the `<img>` and the gradient + initial stays.
