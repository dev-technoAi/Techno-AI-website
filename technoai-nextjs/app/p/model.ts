// Shape of content/models/*.json (written by scripts/build-page-models.mjs).

export type Card = {
  title?: string; // inline html
  eyebrow?: string;
  text: string[]; // inline html paragraphs
  list?: string[];
  image?: string;
  icon?: string; // svg markup
  href?: string;
  cta?: string;
};

export type FormBlock = {
  t: "form";
  name: string;
  hidden: Record<string, string>;
  fields: { name: string; type: string; label: string; placeholder?: string; required: boolean; options?: { value: string; label: string }[] }[];
  submit: string;
};

export type Block =
  | { t: "eyebrow"; text: string }
  | { t: "h"; level: number; html: string }
  | { t: "p"; html: string }
  | { t: "ul"; items: string[]; ordered?: boolean }
  | { t: "img"; src: string; alt: string; bg?: boolean; small?: boolean }
  | { t: "btn"; text: string; href: string }
  | { t: "icon"; svg: string }
  | { t: "video"; src: string; iframe?: boolean }
  | { t: "grid"; items: Card[] }
  | FormBlock;

export type PageModel = {
  route: string;
  file: string;
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  kind: "page" | "post";
  date?: string;
  hero: { eyebrow?: string; title: string; lead: string[]; buttons: { text: string; href: string }[]; image?: string };
  sections: { blocks: Block[] }[];
};
