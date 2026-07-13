import type { NavItem } from "@/types"

export const site = {
  name: "Richard James",
  tagline: "South African Artist & Sculptor",
  location: "Port Elizabeth & Cape Town",
  email: "richardjames502@gmail.com",
  phone: "+27 79 427 3687",
  phoneHref: "tel:+27794273687",
  url: "https://www.richardjamesart.com",
  description:
    "Richard James — South African artist and sculptor based in Port Elizabeth and Cape Town. Contemporary sculpture and works exploring Buddhist practice, affect theory and the unborn.",
  fonts: { display: "Cinzel", body: "Quattrocento" },
} as const

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Essay", href: "/essay" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]
