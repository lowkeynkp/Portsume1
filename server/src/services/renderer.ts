import type { Portfolio } from "@portsume/shared";
import { renderEditorial } from "./renderer/templates/editorial.js";
import { renderDeveloper } from "./renderer/templates/developer.js";
import { renderProfessional } from "./renderer/templates/professional.js";
import { renderCreative } from "./renderer/templates/creative.js";
import { renderStudio } from "./renderer/templates/studio.js";
import { renderExecutive } from "./renderer/templates/executive.js";
import { renderMagazine } from "./renderer/templates/magazine.js";

/** Render a portfolio to a self-contained HTML document using the template
 *  chosen for its themeId. Content is read live from portfolio JSON on every
 *  request — themes are view layers, publishing never bakes content into
 *  files. Switching a portfolio's theme re-renders the site instantly. */
export function renderPortfolio(p: Portfolio): string {
  switch (p.themeId) {
    case "developer":
      return renderDeveloper(p);
    case "professional":
      return renderProfessional(p);
    case "creative":
      return renderCreative(p);
    case "studio":
      return renderStudio(p);
    case "executive":
      return renderExecutive(p);
    case "magazine":
      return renderMagazine(p);
    case "editorial":
    default:
      return renderEditorial(p);
  }
}
