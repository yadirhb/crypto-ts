const clone = <T>(source: T): T => {
  if (source === null) return source;

  if (source instanceof Date) return new Date(source.getTime()) as any;

  if (source instanceof Array)
    return source.map((item: any) => clone(item)) as any;

  if (typeof source === 'object' && source !== {}) {
    const clonnedObj = { ...(source as { [key: string]: any }) } as {
      [key: string]: any;
    };
    Object.keys(clonnedObj).forEach(prop => {
      clonnedObj[prop] = clone(clonnedObj[prop]) as any;
    });

    return clonnedObj as T;
  }

  return source;
};

export abstract class Base {
  public clone(): any {
    const cloneObj = new (this.constructor as any)(); // line fixed

    for (let key in this) {
      if (typeof this[key] === 'object') {
        cloneObj[key] = clone(this[key]);
      } else {
        cloneObj[key] = this[key];
      }
    }

    return cloneObj;
  }
}
