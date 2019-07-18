import { AppCanvas } from '../src/app_canvas.mjs';
import { RunLoop } from '../src/run_loop.mjs';

describe("AppCanvas", () => {
  it("should create and initialize a canvas", () => {
    const app = new AppCanvas();
    expect(app.canvas).toBeTruthy();
    expect(app.ctx).toBeTruthy();
    expect(app.ctx.__getEvents()).toMatchSnapshot();

    expect(document.body.firstElementChild).toBe(app.canvas);
  });

  it("should resize canvas on window resize", () => {
    const app = new AppCanvas();
    const old_width = app.canvas.width;
    const old_height = app.canvas.height;

    global.requestAnimationFrame = jest.fn((c) => c());
    const mock_draw = jest.fn();
    RunLoop.draw = mock_draw;

    global.innerWidth = old_width * 2;
    global.innerHeight = old_height * 2;
    global.dispatchEvent(new Event('resize'));

    expect(app.canvas.width).toBe(old_width * 2 - 2);
    expect(app.canvas.height).toBe(old_height * 2 - 6);

    expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(mock_draw).toHaveBeenCalledTimes(1);
  })
});
