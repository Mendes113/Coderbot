declare module "turndown" {
  export default class TurndownService {
    constructor(options?: {
      headingStyle?: string;
      codeBlockStyle?: string;
      bulletListMarker?: string;
      strongDelimiter?: string;
      emDelimiter?: string;
    });
    turndown(html: string): string;
    addRule(name: string, rule: unknown): this;
    keep(filter: string | string[]): this;
  }
}
