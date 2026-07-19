import type { NavItem } from "@/types"

export const site = {
  name: "Richard James",
  tagline: "British Artist in South Africa",
  location: "Gqeberha (formerly Port Elizabeth)",
  email: "richardjames502@gmail.com",
  phone: "+27 79 427 3687",
  phoneHref: "tel:+27794273687",
  url: "https://www.richardjamesart.com",
  description:
    "Richard James — British artist based in Gqeberha (formerly Port Elizabeth), South Africa. Contemporary works exploring Buddhist practice, affect theory and the unborn.",
  fonts: { display: "Cinzel", body: "Quattrocento" },
} as const

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Essay", href: "/essay" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]
