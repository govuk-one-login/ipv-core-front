/**
 * BDD Context Helper
 * Used to store and retrieve shared state across step definitions
 */
export class BddContext {
  private static context: Map<string, any> = new Map();

  static set(key: string, value: any): void {
    this.context.set(key, value);
  }

  static get(key: string): any {
    return this.context.get(key);
  }

  static clear(): void {
    this.context.clear();
  }

  static has(key: string): boolean {
    return this.context.has(key);
  }
}
