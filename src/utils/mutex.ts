export class Mutex {
  private locked = false;
  private _interval = 0;
  constructor(interval = 0) {
    this.locked = false;
    this._interval = interval;
  }

  private static _lock(mutex: Mutex) {
    if (mutex.locked) {
      // is already locked, can't execute
      return false;
    }
    mutex.locked = true;
    // was not already locked, can execute
    return true;
  }

  private static _unlock(mutex: Mutex) {
    if (!mutex.locked) {
      return false;
    }

    mutex.locked = false;
    return true;
  }

  getLock<T>(func: () => Promise<T>): Promise<T> {
    const self = this;
    return new Promise(function executor(resolve, reject) {
      if (!Mutex._lock(self)) {
        // was already locked, try again at given interval
        setTimeout(() => {
          executor(resolve, reject);
        }, self._interval);
        return;
      }

      // try getting promise
      let prom;
      try {
        prom = func();
      } catch (e) {
        reject(e);
        Mutex._unlock(self);
        return;
      }

      Promise.resolve(prom)
        .then((res) => {
          resolve(res as T);
          Mutex._unlock(self);
        })
        .catch((err) => {
          reject(err);
          Mutex._unlock(self);
        });
    });
  }
}
