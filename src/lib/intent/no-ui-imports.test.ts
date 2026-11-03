import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src/lib/intent");

describe("src/lib/intent", () => {
  it("no importa React ni componentes de UI", () => {
    const files = readdirSync(dir).filter((f) => /\.(ts|tsx)$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(file.endsWith(".tsx"), file).toBe(false);
      const source = readFileSync(join(dir, file), "utf8");
      expect(source, file).not.toMatch(/from\s+["'](react|react-dom|next)(\/[^"']*)?["']/);
      expect(source, file).not.toMatch(/from\s+["']@\/(components|app)(\/[^"']*)?["']/);
    }
  });
});
