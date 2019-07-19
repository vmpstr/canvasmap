import { AppCanvas } from '../src/app_canvas.mjs';
import { RunLoop } from '../src/run_loop.mjs';
import { Point } from '../src/geometry/point.mjs';

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

    app.clearCanvas();
    expect(app.ctx.__getEvents()).toMatchSnapshot();
  })

  it("maps globalToLocal correctly", () => {
    const app = new AppCanvas();
    // Identity.
    expect(app.globalToLocal(new Point([123, 321])))
      .toStrictEqual(new Point([123, 321]));

    // Client offset.
    app.client_offset_ = new Point([10, 20]);
    expect(app.globalToLocal(new Point([123, 321])))
      .toStrictEqual(new Point([113, 301]));
    app.client_offset_ = new Point([0, 0]);

    // Scroll offset.
    app.global_scroll_offset_ = new Point([10, 20]);
    expect(app.globalToLocal(new Point([123, 321])))
      .toStrictEqual(new Point([113, 301]));
    app.global_scroll_offset_ = new Point([0, 0]);

    // Zoom.
    app.zoom = 2;
    expect(app.globalToLocal(new Point([123, 321])))
      .toStrictEqual(new Point([61.5, 160.5]));

    // Zoom + client offset
    app.client_offset_ = new Point([10, 20]);
    expect(app.globalToLocal(new Point([123, 321])))
      .toStrictEqual(new Point([(123 - 10) / 2, (321 - 20) / 2]));
    app.client_offset_ = new Point([0, 0]);

    // Zoom + scroll offset.
    app.global_scroll_offset_ = new Point([10, 20]);
    expect(app.globalToLocal(new Point([123, 321])))
      .toStrictEqual(new Point([(123 - 10) / 2, (321 - 20) / 2]));
    app.global_scroll_offset_ = new Point([0, 0]);
  });

  it("should allow mousedown event listeners", () => {
    const app = new AppCanvas();
    const expect_identity = jest.fn((p, e) => {
      expect(p).toStrictEqual(new Point([123, 321]));
      expect(e.toString()).toBe("[object MouseEvent]");
      expect(e.type).toBe("mousedown");
    });

    app.addEventListener("mousedown", expect_identity);
    app.canvas.dispatchEvent(new MouseEvent(
      "mousedown",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    expect(expect_identity).toHaveBeenCalledTimes(1);
    app.removeEventListener("mousedown", expect_identity);

    // Now with zoom.
    app.zoom = 2;
    const expect_zoomed = jest.fn((p, e) => {
      expect(p).toStrictEqual(new Point([61.5, 160.5]));
      expect(e.toString()).toBe("[object MouseEvent]");
      expect(e.type).toBe("mousedown");
    });
    app.addEventListener("mousedown", expect_zoomed);

    app.canvas.dispatchEvent(new MouseEvent(
      "mousedown",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    expect(expect_zoomed).toHaveBeenCalledTimes(1);

    // Try with another instance of the same handler.
    app.addEventListener("mousedown", expect_zoomed);
    app.canvas.dispatchEvent(new MouseEvent(
      "mousedown",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    // 2 more times (3 total).
    expect(expect_zoomed).toHaveBeenCalledTimes(3);
  });

  it("should remove all instances of handlers", () => {
    const app = new AppCanvas();
    const fail_if_called = jest.fn();

    app.addEventListener("mousedown", fail_if_called);
    app.addEventListener("mousedown", fail_if_called);
    app.addEventListener("mousedown", fail_if_called);
    app.addEventListener("mousedown", fail_if_called);
    app.removeEventListener("mousedown", fail_if_called);

    app.canvas.dispatchEvent(new MouseEvent(
      "mousedown",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    expect(fail_if_called).toHaveBeenCalledTimes(0);
  });

  it("should allow mouseup event listeners", () => {
    const app = new AppCanvas();
    const expect_identity = jest.fn((p, e) => {
      expect(p).toStrictEqual(new Point([123, 321]));
      expect(e.toString()).toBe("[object MouseEvent]");
      expect(e.type).toBe("mouseup");
    });

    app.addEventListener("mouseup", expect_identity);
    app.canvas.dispatchEvent(new MouseEvent(
      "mouseup",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    expect(expect_identity).toHaveBeenCalledTimes(1);
    app.removeEventListener("mouseup", expect_identity);

    // Now with zoom.
    app.zoom = 2;
    const expect_zoomed = jest.fn((p, e) => {
      expect(p).toStrictEqual(new Point([61.5, 160.5]));
      expect(e.toString()).toBe("[object MouseEvent]");
      expect(e.type).toBe("mouseup");
    });
    app.addEventListener("mouseup", expect_zoomed);

    app.canvas.dispatchEvent(new MouseEvent(
      "mouseup",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    expect(expect_zoomed).toHaveBeenCalledTimes(1);

    // Try with another instance of the same handler.
    app.addEventListener("mouseup", expect_zoomed);
    app.canvas.dispatchEvent(new MouseEvent(
      "mouseup",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    // 2 more times (3 total).
    expect(expect_zoomed).toHaveBeenCalledTimes(3);
  });

  it("should allow mousemove event listeners", () => {
    const app = new AppCanvas();
    const expect_full_delta = jest.fn((p, d, e) => {
      expect(p).toStrictEqual(new Point([123, 321]));
      expect(d).toStrictEqual([123, 321]);
      expect(e.toString()).toBe("[object MouseEvent]");
      expect(e.type).toBe("mousemove");
    });

    app.addEventListener("mousemove", expect_full_delta);
    app.canvas.dispatchEvent(new MouseEvent(
      "mousemove",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    expect(expect_full_delta).toHaveBeenCalledTimes(1);
    app.removeEventListener("mousemove", expect_full_delta);

    const expect_small_delta = jest.fn((p, d, e) => {
      expect(p).toStrictEqual(new Point([134, 343]));
      expect(d).toStrictEqual([11, 22]);
      expect(e.toString()).toBe("[object MouseEvent]");
      expect(e.type).toBe("mousemove");
    });

    app.addEventListener("mousemove", expect_small_delta);
    app.canvas.dispatchEvent(new MouseEvent(
      "mousemove",
      {
        clientX: 134,
        clientY: 343,
        button: 0
      })
    );
    expect(expect_small_delta).toHaveBeenCalledTimes(1);
    app.removeEventListener("mousemove", expect_small_delta);
      
    // Now with zoom.
    app.zoom = 2;
    const expect_zoomed = jest.fn((p, d, e) => {
      expect(p).toStrictEqual(new Point([61.5, 160.5]));
      expect(d).toStrictEqual([-5.5, -11]);
      expect(e.toString()).toBe("[object MouseEvent]");
      expect(e.type).toBe("mousemove");
    });
    app.addEventListener("mousemove", expect_zoomed);

    app.canvas.dispatchEvent(new MouseEvent(
      "mousemove",
      {
        clientX: 123,
        clientY: 321,
        button: 0
      })
    );

    expect(expect_zoomed).toHaveBeenCalledTimes(1);
  });
});
