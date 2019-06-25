export class RunLoop {
  static postTaskAndDraw(task) {
    if (task)
      RunLoop.tasks.push(task);
    if (!RunLoop.animationScheduled_) {
      requestAnimationFrame(RunLoop.handleAnimationFrame);
      RunLoop.animationScheduled_ = true;
    }
  }

  static handleAnimationFrame() {
    for (let i = 0; i < RunLoop.tasks.length; ++i)
      RunLoop.tasks[i]();
    RunLoop.tasks = [];
    RunLoop.draw();
    RunLoop.animationScheduled_ = false;
  }
}

RunLoop.tasks = [];
RunLoop.animationScheduled_ = false;

