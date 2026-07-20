import type { NavItem } from "@/types"

export const site = {
  name: "Richard James",
  tagline: "South African / UK Artist",
  location: "Gqeberha (Port Elizabeth), South Africa",
  email: "richardjames502@gmail.com",
  phone: "+27 79 427 3687",
  phoneHref: "tel:+27794273687",
  url: "https://www.richardjamesart.com",
  description:
    "Richard James — South African / UK artist based in Gqeberha (Port Elizabeth), South Africa. Contemporary works exploring Buddhist practice, affect theory and the unborn.",
  fonts: { display: "Cinzel", body: "Quattrocento" },
} as const

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Essay", href: "/essay" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]
