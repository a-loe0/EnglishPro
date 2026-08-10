# EnglishPro - UI Design Document

## UI Design Tool

**Design Method:** Use the `frontend-design` skill in Claude Code to generate production-grade UI components and pages.

To create UI components, invoke the skill with:
```
/frontend-design
```

This skill generates distinctive, polished frontend code following the design specifications below.

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Light Blue | `#F0F4FF` | Background |
| White | `#FFFFFF` | Cards, header |
| Purple | `#6366F1` | Primary, gradient start |
| Pink | `#EC4899` | Accent, gradient end |
| Light Purple | `#EDE9FE` | Progress cards |
| Purple Blue | `#818CF8` | Video thumbnails |
| Black | `#000000` | Text |

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Logo | Inter | Bold | 24px |
| Headline | Inter | Bold | 48px |
| Subheadline | Inter | Regular | 18px |
| Section Title | Inter | Bold | 24px |
| Body | Inter | Regular | 16px |

## Page Layouts

### Homepage
- Header with logo and navigation
- Hero section with gradient background
- Student progress dashboard section
- Video lessons section

### Key Components
- Navigation bar (white, drop shadow)
- Progress cards (rounded corners, light purple)
- Video thumbnails (rounded corners, purple-blue)

## Design Specifications

- **Desktop Width:** 1440px
- **Corner Radius:** 12px (cards, thumbnails)
- **Header Height:** 70px
- **Drop Shadow:** Header navigation

## Pages to Design

- [ ] Homepage (in progress)
- [ ] Login / Registration
- [ ] Student Dashboard
- [ ] Teacher Dashboard
- [ ] Video Lesson Player
- [ ] Video Upload (Teacher)
- [ ] Speaking Submission (Student)
- [ ] Progress Reports
