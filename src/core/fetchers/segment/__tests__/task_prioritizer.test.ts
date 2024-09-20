import { describe, it, expect, vi } from "vitest";
import noop from "../../../../utils/noop";
import type {
  CancellationError,
  CancellationSignal,
} from "../../../../utils/task_canceller";
import TaskCanceller from "../../../../utils/task_canceller";
import type { ITaskFn } from "../task_prioritizer";
import TaskPrioritizer from "../task_prioritizer";

function generateTaskFunction<T>(res: T): ITaskFn<T> {
  return (cancelSignal: CancellationSignal) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => resolve(res), 10);
      cancelSignal.register((err: CancellationError) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  };
}

describe("SegmentFetchers TaskPrioritizer", () => {
  it("should not throw if updating the priority of a non-existent task", () => {
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    expect(() => {
      prioritizer.updatePriority(() => Promise.resolve(), 1);
    }).not.toThrow();
  });

  it("should run task right away", () => {
    const task = vi.fn(generateTaskFunction(0));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let wasInterrupted = 0;
    let wasEnded = false;
    const taskCanceller = new TaskCanceller();
    const prom = prioritizer
      .create(
        task,
        99,
        {
          beforeInterrupted() {
            wasInterrupted++;
          },
          beforeEnded() {
            wasEnded = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(0);
        expect(wasInterrupted).toEqual(0);
        expect(wasEnded).toEqual(true);
        expect(task).toHaveBeenCalledTimes(1);
      });
    expect(task).toHaveBeenCalledTimes(1);
    return prom;
  });

  it("should throw if the given high priority is a higher (or equal) number than the given low priority", () => {
    expect(() => new TaskPrioritizer({ prioritySteps: { high: 7, low: 6 } })).toThrow();
    expect(() => new TaskPrioritizer({ prioritySteps: { high: 7, low: 7 } })).toThrow();
    expect(
      () => new TaskPrioritizer({ prioritySteps: { high: 7, low: 8 } }),
    ).not.toThrow();
  });

  it("should run multiple tasks of same priority right away", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const task3 = vi.fn(generateTaskFunction(3));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    let was3Interrupted = 0;
    let was3Ended = false;
    const taskCanceller = new TaskCanceller();

    prioritizer
      .create(
        task1,
        99,
        {
          beforeInterrupted() {
            was1Interrupted++;
          },
          beforeEnded() {
            was1Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
        expect(task1).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).toHaveBeenCalledTimes(1);
      }, noop);

    prioritizer
      .create(
        task2,
        99,
        {
          beforeInterrupted() {
            was2Interrupted++;
          },
          beforeEnded() {
            was2Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
        expect(task1).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).toHaveBeenCalledTimes(1);
      }, noop);

    const prom = prioritizer
      .create(
        task3,
        99,
        {
          beforeInterrupted() {
            was3Interrupted++;
          },
          beforeEnded() {
            was3Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(3);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
        expect(was3Interrupted).toEqual(0);
        expect(was3Ended).toEqual(true);
        expect(task1).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).toHaveBeenCalledTimes(1);
      });
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(1);
    return prom;
  });

  it("should not wait when tasks are run from lowest priority to highest", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const task3 = vi.fn(generateTaskFunction(3));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    let was3Interrupted = 0;
    let was3Ended = false;
    const taskCanceller = new TaskCanceller();

    prioritizer
      .create(
        task1,
        20,
        {
          beforeInterrupted() {
            was1Interrupted++;
          },
          beforeEnded() {
            was1Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
        expect(task1).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).toHaveBeenCalledTimes(1);
      }, noop);

    prioritizer
      .create(
        task2,
        15,
        {
          beforeInterrupted() {
            was2Interrupted++;
          },
          beforeEnded() {
            was2Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
        expect(task1).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).toHaveBeenCalledTimes(1);
      }, noop);

    const prom = prioritizer
      .create(
        task3,
        10,
        {
          beforeInterrupted() {
            was3Interrupted++;
          },
          beforeEnded() {
            was3Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(3);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
        expect(was3Interrupted).toEqual(0);
        expect(was3Ended).toEqual(true);
        expect(task1).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).toHaveBeenCalledTimes(1);
      });
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(1);
    return prom;
  });

  it("should wait for higher-priority tasks", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const task3 = vi.fn(generateTaskFunction(3));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    let was3Interrupted = 0;
    let was3Ended = false;
    const taskCanceller = new TaskCanceller();

    prioritizer
      .create(
        task1,
        10,
        {
          beforeInterrupted() {
            was1Interrupted++;
          },
          beforeEnded() {
            was1Ended = true;
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(0);
            expect(task3).toHaveBeenCalledTimes(0);
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
      }, noop);

    prioritizer
      .create(
        task2,
        15,
        {
          beforeInterrupted() {
            was2Interrupted++;
          },
          beforeEnded() {
            was2Ended = true;
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(0);
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
      }, noop);

    const prom = prioritizer
      .create(
        task3,
        20,
        {
          beforeInterrupted() {
            was3Interrupted++;
          },
          beforeEnded() {
            was3Ended = true;
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(3);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
        expect(was3Interrupted).toEqual(0);
        expect(was3Ended).toEqual(true);
      });
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(0);
    expect(task3).toHaveBeenCalledTimes(0);
    return prom;
  });

  it("should interrupt low-priority tasks when high-priority ones are created", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const task3 = vi.fn(generateTaskFunction(3));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    let was3Interrupted = 0;
    let was3Ended = false;
    const taskCanceller = new TaskCanceller();

    const prom = prioritizer
      .create(
        task1,
        25,
        {
          beforeInterrupted() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(0);
            was1Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(true);
            expect(was3Interrupted).toEqual(0);
            expect(was3Ended).toEqual(true);
            was1Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(1);
        expect(was1Ended).toEqual(true);
      });

    prioritizer
      .create(
        task2,
        1,
        {
          beforeInterrupted() {
            was2Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(0);
            expect(was1Interrupted).toEqual(1);
            expect(was1Ended).toEqual(false);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(false);
            was2Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
      }, noop);

    prioritizer
      .create(
        task3,
        10,
        {
          beforeInterrupted() {
            was3Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(1);
            expect(was1Ended).toEqual(false);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(true);
            was3Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(3);
        expect(was3Interrupted).toEqual(0);
        expect(was3Ended).toEqual(true);
      }, noop);
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(0);
    return prom;
  });

  it("should be able to update a priority", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const task3 = vi.fn(generateTaskFunction(3));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    let was3Interrupted = 0;
    let was3Ended = false;
    const taskCanceller = new TaskCanceller();

    const prom = prioritizer
      .create(
        task1,
        25,
        {
          beforeInterrupted() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
            was1Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(true);
            expect(was3Interrupted).toEqual(0);
            expect(was3Ended).toEqual(true);
            was1Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(1);
        expect(was1Ended).toEqual(true);
      });

    prioritizer
      .create(
        task2,
        26,
        {
          beforeInterrupted() {
            was2Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(1);
            expect(was1Ended).toEqual(false);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(false);
            was2Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
      }, noop);

    prioritizer
      .create(
        task3,
        10,
        {
          beforeInterrupted() {
            was3Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(1);
            expect(was1Ended).toEqual(false);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(false);
            was3Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(3);
        expect(was3Interrupted).toEqual(0);
        expect(was3Ended).toEqual(true);
      }, noop);

    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(0);
    expect(task3).toHaveBeenCalledTimes(1);

    prioritizer.updatePriority(task2, 1);
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(1);
    return prom;
  });

  it("should restart interrupted task if given the right priority", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const task3 = vi.fn(generateTaskFunction(3));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    let was3Interrupted = 0;
    let was3Ended = false;
    const taskCanceller = new TaskCanceller();

    const prom = prioritizer
      .create(
        task1,
        25,
        {
          beforeInterrupted() {
            prioritizer.updatePriority(task1, 1);
            was1Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(0);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(true);
            expect(was3Interrupted).toEqual(0);
            expect(was3Ended).toEqual(false);
            was1Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(1);
        expect(was1Ended).toEqual(true);
      });

    prioritizer
      .create(
        task2,
        2,
        {
          beforeInterrupted() {
            was2Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(0);
            expect(was1Interrupted).toEqual(1);
            expect(was1Ended).toEqual(false);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(false);
            was2Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
      }, noop);

    prioritizer
      .create(
        task3,
        10,
        {
          beforeInterrupted() {
            was3Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(1);
            expect(was1Ended).toEqual(true);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(true);
            was3Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(3);
        expect(was3Interrupted).toEqual(0);
        expect(was3Ended).toEqual(true);
      }, noop);
    expect(task1).toHaveBeenCalledTimes(2);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(0);
    return prom;
  });

  it("should be able to update the priority of pending tasks", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const task3 = vi.fn(generateTaskFunction(3));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    let was3Interrupted = 0;
    let was3Ended = false;
    const taskCanceller = new TaskCanceller();

    const prom = prioritizer
      .create(
        task1,
        25,
        {
          beforeInterrupted() {
            prioritizer.updatePriority(task1, 1);
            was1Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(0);
            expect(was1Interrupted).toEqual(1);
            expect(was2Interrupted).toEqual(1);
            expect(was3Interrupted).toEqual(0);
            expect(was2Ended).toEqual(false);
            expect(was3Ended).toEqual(false);
            was1Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(1);
        expect(was1Ended).toEqual(true);
      });

    prioritizer
      .create(
        task2,
        2,
        {
          beforeInterrupted() {
            expect(was1Interrupted).toEqual(1);
            was2Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(2);
            expect(task3).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(1);
            expect(was2Interrupted).toEqual(1);
            expect(was1Ended).toEqual(true);
            expect(was3Ended).toEqual(true);
            was2Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was2Interrupted).toEqual(1);
        expect(was2Ended).toEqual(true);
      }, noop);

    prioritizer
      .create(
        task3,
        10,
        {
          beforeInterrupted() {
            was3Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(task3).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(1);
            expect(was1Ended).toEqual(true);
            expect(was2Interrupted).toEqual(1);
            expect(was2Ended).toEqual(false);
            was3Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(3);
        expect(was3Interrupted).toEqual(0);
        expect(was3Ended).toEqual(true);
      }, noop);
    expect(task1).toHaveBeenCalledTimes(2);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(0);
    expect(was1Interrupted).toEqual(1);
    expect(was2Interrupted).toEqual(0);
    expect(was3Interrupted).toEqual(0);

    prioritizer.updatePriority(task2, 25);
    expect(task1).toHaveBeenCalledTimes(2);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(task3).toHaveBeenCalledTimes(0);
    expect(was1Interrupted).toEqual(1);
    expect(was2Interrupted).toEqual(1);
    expect(was3Interrupted).toEqual(0);
    return prom;
  });

  it("should be able to interrupt a task after a priority update on a pending task", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    const taskCanceller = new TaskCanceller();

    const prom = prioritizer
      .create(
        task1,
        25,
        {
          beforeInterrupted() {
            was1Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(2);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(1);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(true);
            was1Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(1);
        expect(was1Ended).toEqual(true);
      });

    prioritizer
      .create(
        task2,
        25,
        {
          beforeInterrupted() {
            was2Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(1);
            expect(was2Interrupted).toEqual(0);
            expect(was1Ended).toEqual(false);
            was2Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
      }, noop);
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(was1Interrupted).toEqual(0);
    expect(was2Interrupted).toEqual(0);

    prioritizer.updatePriority(task2, 5);
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(1);
    expect(was1Interrupted).toEqual(1);
    expect(was2Interrupted).toEqual(0);
    return prom;
  });

  it("should not start right away an updated task which has still not the priority", () => {
    const task1 = vi.fn(generateTaskFunction(1));
    const task2 = vi.fn(generateTaskFunction(2));
    const prioritizer = new TaskPrioritizer({
      prioritySteps: { high: 5, low: 20 },
    });
    let was1Interrupted = 0;
    let was1Ended = false;
    let was2Interrupted = 0;
    let was2Ended = false;
    const taskCanceller = new TaskCanceller();

    prioritizer
      .create(
        task1,
        15,
        {
          beforeInterrupted() {
            was1Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(0);
            expect(was1Interrupted).toEqual(0);
            expect(was2Interrupted).toEqual(0);
            expect(was2Ended).toEqual(false);
            was1Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(1);
        expect(was1Interrupted).toEqual(0);
        expect(was1Ended).toEqual(true);
      }, noop);

    const prom = prioritizer
      .create(
        task2,
        19,
        {
          beforeInterrupted() {
            was2Interrupted++;
          },
          beforeEnded() {
            expect(task1).toHaveBeenCalledTimes(1);
            expect(task2).toHaveBeenCalledTimes(1);
            expect(was1Interrupted).toEqual(0);
            expect(was2Interrupted).toEqual(0);
            expect(was1Ended).toEqual(true);
            was2Ended = true;
          },
        },
        taskCanceller.signal,
      )
      .then((val) => {
        expect(val).toEqual(2);
        expect(was2Interrupted).toEqual(0);
        expect(was2Ended).toEqual(true);
      });
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(0);
    expect(was1Interrupted).toEqual(0);
    expect(was2Interrupted).toEqual(0);

    prioritizer.updatePriority(task2, 16);
    expect(task1).toHaveBeenCalledTimes(1);
    expect(task2).toHaveBeenCalledTimes(0);
    expect(was1Interrupted).toEqual(0);
    expect(was2Interrupted).toEqual(0);
    return prom;
  });
});
