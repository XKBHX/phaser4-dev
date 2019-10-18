function Angle(line) {
  return Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
}

function Height(line) {
  return Math.abs(line.y1 - line.y2);
}

class Line {
  constructor() {
    var x1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y1 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var x2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var y2 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    this.setTo(x1, y1, x2, y2);
  }

  setTo() {
    var x1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y1 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var x2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var y2 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    return this;
  }

  get left() {
    return Math.min(this.x1, this.x2);
  }

  set left(value) {
    if (this.x1 <= this.x2) {
      this.x1 = value;
    } else {
      this.x2 = value;
    }
  }

  get right() {
    return Math.max(this.x1, this.x2);
  }

  set right(value) {
    if (this.x1 > this.x2) {
      this.x1 = value;
    } else {
      this.x2 = value;
    }
  }

  get top() {
    return Math.min(this.y1, this.y2);
  }

  set top(value) {
    if (this.y1 <= this.y2) {
      this.y1 = value;
    } else {
      this.y2 = value;
    }
  }

  get bottom() {
    return Math.max(this.y1, this.y2);
  }

  set bottom(value) {
    if (this.y1 > this.y2) {
      this.y1 = value;
    } else {
      this.y2 = value;
    }
  }

}

var test = new Line(0, 100, 400, 50);
console.log(test);
console.log('angle', Angle(test));
console.log('height', Height(test));
