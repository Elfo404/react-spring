import _extends from '@babel/runtime/helpers/esm/extends'
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose'
import React, {
  useState,
  useCallback,
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react'

const is = {
  arr: Array.isArray,
  obj: a => Object.prototype.toString.call(a) === '[object Object]',
  fun: a => typeof a === 'function',
  str: a => typeof a === 'string',
  num: a => typeof a === 'number',
  und: a => a === void 0,
  nul: a => a === null,
  boo: a => typeof a === 'boolean',
  set: a => a instanceof Set,
  map: a => a instanceof Map,

  equ(a, b) {
    if (typeof a !== typeof b) return false
    if (is.str(a) || is.num(a)) return a === b
    if (
      is.obj(a) &&
      is.obj(b) &&
      Object.keys(a).length + Object.keys(b).length === 0
    )
      return true
    let i

    for (i in a) if (!(i in b)) return false

    for (i in b) if (a[i] !== b[i]) return false

    return is.und(i) ? a === b : true
  },
}
function useForceUpdate() {
  const _useState = useState(false),
    f = _useState[1]

  const forceUpdate = useCallback(() => f(v => !v), [])
  return forceUpdate
}
function withDefault(value, defaultValue) {
  return is.und(value) || is.nul(value) ? defaultValue : value
}
function toArray(a) {
  return !is.und(a) ? (is.arr(a) ? a : [a]) : []
}
function callProp(obj) {
  for (
    var _len = arguments.length,
      args = new Array(_len > 1 ? _len - 1 : 0),
      _key = 1;
    _key < _len;
    _key++
  ) {
    args[_key - 1] = arguments[_key]
  }

  return is.fun(obj) ? obj(...args) : obj
}

function getForwardProps(props) {
  const to = props.to,
    from = props.from,
    config = props.config,
    onStart = props.onStart,
    onRest = props.onRest,
    onFrame = props.onFrame,
    children = props.children,
    cancel = props.cancel,
    reset = props.reset,
    reverse = props.reverse,
    force = props.force,
    immediate = props.immediate,
    delay = props.delay,
    attach = props.attach,
    destroyed = props.destroyed,
    interpolateTo = props.interpolateTo,
    ref = props.ref,
    lazy = props.lazy,
    forward = _objectWithoutPropertiesLoose(props, [
      'to',
      'from',
      'config',
      'onStart',
      'onRest',
      'onFrame',
      'children',
      'cancel',
      'reset',
      'reverse',
      'force',
      'immediate',
      'delay',
      'attach',
      'destroyed',
      'interpolateTo',
      'ref',
      'lazy',
    ])

  return forward
}

function interpolateTo(props) {
  const forward = getForwardProps(props)
  props = Object.entries(props).reduce((props, _ref) => {
    let key = _ref[0],
      value = _ref[1]
    return key in forward || (props[key] = value), props
  }, {})
  return _extends(
    {
      to: forward,
    },
    props
  )
}
function handleRef(ref, forward) {
  if (forward) {
    // If it's a function, assume it's a ref callback
    if (is.fun(forward)) forward(ref)
    else if (is.obj(forward)) {
      forward.current = ref
    }
  }

  return ref
}
function fillArray(length, mapIndex) {
  const arr = []

  for (let i = 0; i < length; i++) arr.push(mapIndex(i))

  return arr
}

/**
 * This tries to put deleted items back into the given `out` list in correct
 * order. Deleted items must have a `left` and `right` property with key of
 * their sibling which is used to find the correct placement.
 */
function reconcileDeleted(deleted, current) {
  // Copy as we will be mutating the arrays
  deleted = [...deleted]
  current = [...current] // Used to detect deadlock (when a pass finds 0 siblings)

  let failedTries = 0 // Track where the current pass start/ends

  let passIndex = 0
  let nextPassIndex = deleted.length // Insert all deleted items into `current`

  for (let i = 0; i < deleted.length; i++) {
    if (i === nextPassIndex) {
      // Sanity test: Push to end if somehow no siblings were found
      if (passIndex + failedTries === nextPassIndex) {
        for (let j = i; j < deleted.length; j++) {
          const _deleted$j = deleted[j],
            left = _deleted$j.left,
            right = _deleted$j.right,
            deletedItem = _objectWithoutPropertiesLoose(_deleted$j, [
              'left',
              'right',
            ])

          current.push(deletedItem)
        }

        break
      } // Update local state at the end of each pass

      passIndex = nextPassIndex
      nextPassIndex = deleted.length
      failedTries = 0
    } // The index of the deleted item in `current`

    let index = -1 // Look for the left or right sibling in `current`

    const _deleted$i = deleted[i],
      left = _deleted$i.left,
      right = _deleted$i.right,
      deletedItem = _objectWithoutPropertiesLoose(_deleted$i, ['left', 'right'])

    for (let j = current.length; --j >= 0; ) {
      const key = current[j].originalKey

      if (key === right) {
        index = j
        break
      }

      if (key === left) {
        index = j + 1
        break
      }
    } // Items with no index are revisited in the next pass

    if (index < 0) {
      failedTries++
      deleted.push(deleted[i])
    } else {
      current.splice(index, 0, deletedItem)
    }
  }

  return current
}

class Animated {
  constructor() {
    this.payload = void 0
    this.children = []
  }

  getAnimatedValue() {
    return this.getValue()
  }

  getPayload() {
    return this.payload || this
  }

  attach() {}

  detach() {}

  getChildren() {
    return this.children
  }

  addChild(child) {
    if (this.children.length === 0) this.attach()
    this.children.push(child)
  }

  removeChild(child) {
    const index = this.children.indexOf(child)
    this.children.splice(index, 1)
    if (this.children.length === 0) this.detach()
  }
}
class AnimatedArray extends Animated {
  constructor() {
    super(...arguments)
    this.payload = []

    this.attach = () =>
      this.payload.forEach(p => p instanceof Animated && p.addChild(this))

    this.detach = () =>
      this.payload.forEach(p => p instanceof Animated && p.removeChild(this))
  }
}
class AnimatedObject extends Animated {
  constructor() {
    super(...arguments)
    this.payload = {}

    this.attach = () =>
      Object.values(this.payload).forEach(
        s => s instanceof Animated && s.addChild(this)
      )

    this.detach = () =>
      Object.values(this.payload).forEach(
        s => s instanceof Animated && s.removeChild(this)
      )
  }

  getValue(animated) {
    if (animated === void 0) {
      animated = false
    }

    const payload = {}

    for (const key in this.payload) {
      const value = this.payload[key]
      if (animated && !(value instanceof Animated)) continue
      payload[key] =
        value instanceof Animated
          ? value[animated ? 'getAnimatedValue' : 'getValue']()
          : value
    }

    return payload
  }

  getAnimatedValue() {
    return this.getValue(true)
  }
}

//
// Required
let applyAnimatedValues //
// Optional
//

let now = () => Date.now()
let colorNames = {}
let defaultElement
let manualFrameloop
let createAnimatedStyle
let createAnimatedTransform
let createAnimatedRef = node => node.current
let createStringInterpolator
let requestAnimationFrame =
  typeof window !== 'undefined' ? window.requestAnimationFrame : void 0
let cancelAnimationFrame =
  typeof window !== 'undefined' ? window.cancelAnimationFrame : void 0
let interpolation //
// Configuration
//

const assign = globals => {
  var _Object$assign = Object.assign(
    {
      colorNames,
      defaultElement,
      applyAnimatedValues,
      createStringInterpolator,
      createAnimatedTransform,
      createAnimatedStyle,
      createAnimatedRef,
      requestAnimationFrame,
      cancelAnimationFrame,
      manualFrameloop,
      interpolation,
    },
    globals
  )

  colorNames = _Object$assign.colorNames
  defaultElement = _Object$assign.defaultElement
  applyAnimatedValues = _Object$assign.applyAnimatedValues
  createStringInterpolator = _Object$assign.createStringInterpolator
  createAnimatedTransform = _Object$assign.createAnimatedTransform
  createAnimatedStyle = _Object$assign.createAnimatedStyle
  createAnimatedRef = _Object$assign.createAnimatedRef
  requestAnimationFrame = _Object$assign.requestAnimationFrame
  cancelAnimationFrame = _Object$assign.cancelAnimationFrame
  manualFrameloop = _Object$assign.manualFrameloop
  interpolation = _Object$assign.interpolation
  return _Object$assign
}

var Globals = /*#__PURE__*/ Object.freeze({
  get applyAnimatedValues() {
    return applyAnimatedValues
  },
  now: now,
  get colorNames() {
    return colorNames
  },
  get defaultElement() {
    return defaultElement
  },
  get manualFrameloop() {
    return manualFrameloop
  },
  get createAnimatedStyle() {
    return createAnimatedStyle
  },
  get createAnimatedTransform() {
    return createAnimatedTransform
  },
  get createAnimatedRef() {
    return createAnimatedRef
  },
  get createStringInterpolator() {
    return createStringInterpolator
  },
  get requestAnimationFrame() {
    return requestAnimationFrame
  },
  get cancelAnimationFrame() {
    return cancelAnimationFrame
  },
  get interpolation() {
    return interpolation
  },
  assign: assign,
})

/**
 * Wraps the `style` property with `AnimatedStyle`.
 */

class AnimatedProps extends AnimatedObject {
  constructor(props, callback) {
    super()
    this.update = void 0
    this.payload =
      props.style && createAnimatedStyle
        ? _extends({}, props, {
            style: createAnimatedStyle(props.style),
          })
        : props
    this.update = callback
    this.attach()
  }
}

const createAnimatedComponent = Component => {
  const AnimatedComponent = forwardRef((props, _ref) => {
    const forceUpdate = useForceUpdate()
    const mounted = useRef(true)
    const propsAnimated = useRef(null)
    const node = useRef(null)
    const attachProps = useCallback(props => {
      const oldPropsAnimated = propsAnimated.current

      const callback = () => {
        if (node.current) {
          const didUpdate = applyAnimatedValues(
            node.current,
            propsAnimated.current.getAnimatedValue()
          )
          if (didUpdate === false) forceUpdate()
        }
      }

      propsAnimated.current = new AnimatedProps(props, callback)
      oldPropsAnimated && oldPropsAnimated.detach()
    }, [])
    useEffect(
      () => () => {
        mounted.current = false
        propsAnimated.current && propsAnimated.current.detach()
      },
      []
    )
    useImperativeHandle(_ref, () =>
      createAnimatedRef(node, mounted, forceUpdate)
    )
    attachProps(props)

    const _getValue = propsAnimated.current.getValue(),
      scrollTop = _getValue.scrollTop,
      scrollLeft = _getValue.scrollLeft,
      animatedProps = _objectWithoutPropertiesLoose(_getValue, [
        'scrollTop',
        'scrollLeft',
      ])

    return React.createElement(
      Component,
      _extends({}, animatedProps, {
        ref: childRef => (node.current = handleRef(childRef, _ref)),
      })
    )
  })
  return AnimatedComponent
}
/**
 * withExtend(animated, options = {})
 */

/** Add an `extend` method to your `animated` factory function */
function withExtend(animated, options) {
  if (options === void 0) {
    options = {}
  }

  const self = animated

  self.extend = function() {
    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key]
    }

    args.forEach(arg => extend(arg))
    return self
  }

  return self

  function extend(arg, overrideKey) {
    // Arrays avoid passing their index to `extend`
    if (is.arr(arg)) {
      return arg.forEach(arg => extend(arg))
    } // Object keys are always used over value inspection

    if (is.obj(arg)) {
      for (const key in arg) extend(arg[key], key)

      return
    } // Use the `overrideKey` or inspect the value for a key

    let key = is.str(overrideKey)
      ? overrideKey
      : is.str(arg)
      ? arg
      : arg && is.str(arg.displayName)
      ? arg.displayName
      : is.fun(arg)
      ? arg.name
      : '' // This lowercases the first letter of the key

    if (options.lowercase) {
      key = key[0].toLowerCase() + key.slice(1)
    } // NOTE(typescript): Properties are not yet inferred from the arguments of
    // the `extend` method and then attached to the `animated` function via
    // the return type.

    self[key] = animated(arg)
  }
}

function createInterpolator(range, output, extrapolate) {
  if (typeof range === 'function') {
    return range
  }

  if (Array.isArray(range)) {
    return createInterpolator({
      range,
      output: output,
      extrapolate,
    })
  }

  if (interpolation && typeof range.output[0] === 'string') {
    return interpolation(range)
  }

  const config = range
  const outputRange = config.output
  const inputRange = config.range || [0, 1]
  const extrapolateLeft =
    config.extrapolateLeft || config.extrapolate || 'extend'
  const extrapolateRight =
    config.extrapolateRight || config.extrapolate || 'extend'

  const easing = config.easing || (t => t)

  return input => {
    const range = findRange(input, inputRange)
    return interpolate(
      input,
      inputRange[range],
      inputRange[range + 1],
      outputRange[range],
      outputRange[range + 1],
      easing,
      extrapolateLeft,
      extrapolateRight,
      config.map
    )
  }
}

function interpolate(
  input,
  inputMin,
  inputMax,
  outputMin,
  outputMax,
  easing,
  extrapolateLeft,
  extrapolateRight,
  map
) {
  let result = map ? map(input) : input // Extrapolate

  if (result < inputMin) {
    if (extrapolateLeft === 'identity') return result
    else if (extrapolateLeft === 'clamp') result = inputMin
  }

  if (result > inputMax) {
    if (extrapolateRight === 'identity') return result
    else if (extrapolateRight === 'clamp') result = inputMax
  }

  if (outputMin === outputMax) return outputMin
  if (inputMin === inputMax) return input <= inputMin ? outputMin : outputMax // Input Range

  if (inputMin === -Infinity) result = -result
  else if (inputMax === Infinity) result = result - inputMin
  else result = (result - inputMin) / (inputMax - inputMin) // Easing

  result = easing(result) // Output Range

  if (outputMin === -Infinity) result = -result
  else if (outputMax === Infinity) result = result + outputMin
  else result = result * (outputMax - outputMin) + outputMin
  return result
}

function findRange(input, inputRange) {
  for (var i = 1; i < inputRange.length - 1; ++i)
    if (inputRange[i] >= input) break

  return i - 1
}

class AnimatedInterpolation extends AnimatedArray {
  constructor(parents, range, output) {
    super()
    this.calc = void 0
    this.calc = createInterpolator(range, output)
    this.payload =
      parents instanceof AnimatedArray &&
      !(parents instanceof AnimatedInterpolation)
        ? parents.getPayload()
        : Array.isArray(parents)
        ? parents
        : [parents]
  }

  getValue() {
    return this.calc(...this.payload.map(value => value.getValue()))
  }

  interpolate(range, output) {
    return new AnimatedInterpolation(this, range, output)
  }
}

const interpolate$1 = (parents, range, output) =>
  parents && new AnimatedInterpolation(parents, range, output)

const config = {
  default: {
    tension: 170,
    friction: 26,
  },
  gentle: {
    tension: 120,
    friction: 14,
  },
  wobbly: {
    tension: 180,
    friction: 12,
  },
  stiff: {
    tension: 210,
    friction: 20,
  },
  slow: {
    tension: 280,
    friction: 60,
  },
  molasses: {
    tension: 280,
    friction: 120,
  },
}

/** API
 *  useChain(references, timeSteps, timeFrame)
 */

function useChain(refs, timeSteps, timeFrame) {
  if (timeFrame === void 0) {
    timeFrame = 1000
  }

  useEffect(() => {
    if (timeSteps) {
      let prevDelay = 0
      refs.forEach((ref, i) => {
        if (!ref.current) return
        const controllers = ref.current.controllers

        if (controllers.length) {
          let delay = timeFrame * timeSteps[i] // Use the previous delay if none exists.

          if (isNaN(delay)) delay = prevDelay
          else prevDelay = delay
          controllers.forEach(ctrl => {
            ctrl.queue.forEach(props => (props.delay += delay))
            ctrl.start()
          })
        }
      })
    } else {
      let p = Promise.resolve()
      refs.forEach(ref => {
        if (!ref.current) return
        const _ref$current = ref.current,
          controllers = _ref$current.controllers,
          start = _ref$current.start

        if (controllers.length) {
          // Take the queue of each controller
          const updates = controllers.map(ctrl => {
            const q = ctrl.queue
            ctrl.queue = []
            return q
          }) // Apply the queue when the previous ref stops animating

          p = p.then(() => {
            controllers.forEach((ctrl, i) => ctrl.queue.push(...updates[i]))
            return start()
          })
        }
      })
    }
  })
}

/**
 * Animated works by building a directed acyclic graph of dependencies
 * transparently when you render your Animated components.
 *
 *               new Animated.Value(0)
 *     .interpolate()        .interpolate()    new Animated.Value(1)
 *         opacity               translateY      scale
 *          style                         transform
 *         View#234                         style
 *                                         View#123
 *
 * A) Top Down phase
 * When an AnimatedValue is updated, we recursively go down through this
 * graph in order to find leaf nodes: the views that we flag as needing
 * an update.
 *
 * B) Bottom Up phase
 * When a view is flagged as needing an update, we recursively go back up
 * in order to build the new value that it needs. The reason why we need
 * this two-phases process is to deal with composite props such as
 * transform which can receive values from multiple parents.
 */

function addAnimatedStyles(node, styles) {
  if ('update' in node) {
    styles.add(node)
  } else {
    node.getChildren().forEach(child => addAnimatedStyles(child, styles))
  }
}

class AnimatedValue extends Animated {
  constructor(_value) {
    var _this

    super()
    _this = this
    this.animatedStyles = new Set()
    this.value = void 0
    this.startPosition = void 0
    this.lastPosition = void 0
    this.lastVelocity = void 0
    this.startTime = void 0
    this.lastTime = void 0
    this.done = false

    this.setValue = function(value, flush) {
      if (flush === void 0) {
        flush = true
      }

      _this.value = value
      if (flush) _this.flush()
    }

    this.value = _value
    this.startPosition = _value
    this.lastPosition = _value
  }

  flush() {
    if (this.animatedStyles.size === 0) {
      addAnimatedStyles(this, this.animatedStyles)
    }

    this.animatedStyles.forEach(animatedStyle => animatedStyle.update())
  }

  clearStyles() {
    this.animatedStyles.clear()
  }

  getValue() {
    return this.value
  }

  interpolate(range, output) {
    return new AnimatedInterpolation(this, range, output)
  }

  reset(isActive) {
    this.startPosition = this.value
    this.lastPosition = this.value
    this.lastVelocity = isActive ? this.lastVelocity : undefined
    this.lastTime = isActive ? this.lastTime : undefined
    this.startTime = now()
    this.done = false
    this.animatedStyles.clear()
  }
}

class AnimatedValueArray extends AnimatedArray {
  constructor(values) {
    super()
    this.payload = values
  }

  setValue(value, flush) {
    if (flush === void 0) {
      flush = true
    }

    if (Array.isArray(value)) {
      if (value.length === this.payload.length) {
        value.forEach((v, i) => this.payload[i].setValue(v, flush))
      }
    } else {
      this.payload.forEach(p => p.setValue(value, flush))
    }
  }

  getValue() {
    return this.payload.map(v => v.getValue())
  }

  interpolate(range, output) {
    return new AnimatedInterpolation(this, range, output)
  }
}

let active = false
const controllers = new Set()

const update = () => {
  if (!active) return false
  let time = now()

  for (let controller of controllers) {
    let isActive = false // Number of updated animations

    let updateCount = 0

    for (
      let configIdx = 0;
      configIdx < controller.configs.length;
      configIdx++
    ) {
      let config = controller.configs[configIdx]
      let endOfAnimation, lastTime

      for (let valIdx = 0; valIdx < config.animatedValues.length; valIdx++) {
        let animated = config.animatedValues[valIdx]
        if (animated.done) continue
        updateCount++
        let to = config.toValues[valIdx]
        let isAnimated = to instanceof Animated
        if (isAnimated) to = to.getValue() // Jump to end value for immediate animations

        if (config.immediate) {
          animated.setValue(to)
          animated.done = true
          continue
        }

        let from = config.fromValues[valIdx] // Break animation when string values are involved

        if (typeof from === 'string' || typeof to === 'string') {
          animated.setValue(to)
          animated.done = true
          continue
        }

        let position = animated.lastPosition
        let velocity = Array.isArray(config.initialVelocity)
          ? config.initialVelocity[valIdx]
          : config.initialVelocity

        if (config.duration !== void 0) {
          /** Duration easing */
          position =
            from +
            config.easing((time - animated.startTime) / config.duration) *
              (to - from)
          endOfAnimation = time >= animated.startTime + config.duration
        } else if (config.decay) {
          /** Decay easing */
          position =
            from +
            (velocity / (1 - 0.998)) *
              (1 - Math.exp(-(1 - 0.998) * (time - animated.startTime)))
          endOfAnimation = Math.abs(animated.lastPosition - position) < 0.1
          if (endOfAnimation) to = position
        } else {
          /** Spring easing */
          lastTime = animated.lastTime !== void 0 ? animated.lastTime : time
          velocity =
            animated.lastVelocity !== void 0
              ? animated.lastVelocity
              : config.initialVelocity // If we lost a lot of frames just jump to the end.

          if (time > lastTime + 64) lastTime = time // http://gafferongames.com/game-physics/fix-your-timestep/

          let numSteps = Math.floor(time - lastTime)

          for (let i = 0; i < numSteps; ++i) {
            let force = -config.tension * (position - to)
            let damping = -config.friction * velocity
            let acceleration = (force + damping) / config.mass
            velocity = velocity + (acceleration * 1) / 1000
            position = position + (velocity * 1) / 1000
          } // Conditions for stopping the spring animation

          let isOvershooting =
            config.clamp && config.tension !== 0
              ? from < to
                ? position > to
                : position < to
              : false
          let isVelocity = Math.abs(velocity) <= config.precision
          let isDisplacement =
            config.tension !== 0
              ? Math.abs(to - position) <= config.precision
              : true
          endOfAnimation = isOvershooting || (isVelocity && isDisplacement)
          animated.lastVelocity = velocity
          animated.lastTime = time
        } // Trails aren't done until their parents conclude

        if (isAnimated && !config.toValues[valIdx].done) endOfAnimation = false

        if (endOfAnimation) {
          // Ensure that we end up with a round value
          if (animated.value !== to) position = to
          animated.done = true
        } else isActive = true

        animated.setValue(position)
        animated.lastPosition = position
      } // Keep track of updated values only when necessary

      if (controller.props.onFrame) {
        controller.values[config.key] = config.animated.getValue()
      }
    }

    controller.onFrame(isActive, updateCount)
  } // Loop over as long as there are controllers ...

  if (controllers.size) {
    if (manualFrameloop) manualFrameloop()
    else requestAnimationFrame(update)
  } else {
    active = false
  }

  return active
}

const start = controller => {
  controllers.add(controller)

  if (!active) {
    active = true
    if (manualFrameloop) manualFrameloop()
    else requestAnimationFrame(update)
  }
}

const stop = controller => {
  controllers.delete(controller)
}

// Default easing
const linear = t => t

const emptyObj = Object.freeze({})
let nextId = 1

class Controller {
  constructor(props) {
    this.id = nextId++
    this.idle = true
    this.props = {}
    this.queue = []
    this.timestamps = {}
    this.values = {}
    this.merged = {}
    this.animated = {}
    this.animations = {}
    this.configs = []
    this.onEndQueue = []
    this.runCount = 0
    if (props) this.update(props).start()
  }
  /**
   * Push props into the update queue. The props are used after `start` is
   * called and any delay is over. The props are intelligently diffed to ensure
   * that later calls to this method properly override any delayed props.
   * The `propsArg` argument is always copied before mutations are made.
   */

  update(propsArg) {
    if (!propsArg) return this
    const props = interpolateTo(propsArg) // For async animations, the `from` prop must be defined for
    // the Animated nodes to exist before animations have started.

    this._ensureAnimated(props.from)

    this._ensureAnimated(props.to)

    props.timestamp = now() // The `delay` prop of every update must be a number >= 0

    if (is.fun(props.delay) && is.obj(props.to)) {
      const from = props.from || emptyObj

      for (const key in props.to) {
        this.queue.push(
          _extends({}, props, {
            to: {
              [key]: props.to[key],
            },
            from:
              key in from
                ? {
                    [key]: from[key],
                  }
                : void 0,
            delay: Math.max(0, Math.round(props.delay(key))),
          })
        )
      }
    } else {
      props.delay = is.num(props.delay)
        ? Math.max(0, Math.round(props.delay))
        : 0 // Coerce falsy values to undefined for these props

      if (!props.to) props.to = void 0
      if (!props.from) props.from = void 0
      this.queue.push(props)
    }

    return this
  }
  /**
   * Flush the update queue.
   * If the queue is empty, try starting the frameloop.
   */

  start(onEnd) {
    if (this.queue.length) this._flush(onEnd)
    else this._start(onEnd)
    return this
  }
  /** Stop one animation or all animations */

  stop() {
    for (
      var _len = arguments.length, keys = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      keys[_key] = arguments[_key]
    }

    let finished = false

    if (is.boo(keys[0])) {
      var _keys = keys
      finished = _keys[0]
      keys = _keys.slice(1)
    } // Stop animations by key

    if (keys.length) {
      for (const key of keys) {
        const index = this.configs.findIndex(config => key === config.key)

        this._stopAnimation(key)

        this.configs[index] = this.animations[key]
      }
    } // Stop all animations
    else if (this.runCount) {
      // Stop all async animations
      this.animations = _extends({}, this.animations) // Update the animation configs

      this.configs.forEach(config => this._stopAnimation(config.key))
      this.configs = Object.values(this.animations) // Exit the frameloop

      this._stop(finished)
    }

    return this
  }
  /** @internal Called by the frameloop */

  onFrame(isActive, updateCount) {
    if (updateCount) {
      const onFrame = this.props.onFrame
      if (onFrame) onFrame(this.values)
    }

    if (!isActive) this._stop(true)
  }
  /** Reset the internal state */

  destroy() {
    this.stop()
    this.props = {}
    this.timestamps = {}
    this.values = {}
    this.merged = {}
    this.animated = {}
    this.animations = {}
    this.configs = []
  }
  /**
   * Set a prop for the next animations where the prop is undefined. The given
   * value is overridden by the next update where the prop is defined.
   *
   * Ongoing animations are not changed.
   */

  setProp(key, value) {
    this.props[key] = value
    this.timestamps[key] = now()
    return this
  } // Create an Animated node if none exists.

  _ensureAnimated(values) {
    if (!is.obj(values)) return

    for (const key in values) {
      if (this.animated[key]) continue
      const value = values[key]
      const animated = createAnimated(value)

      if (animated) {
        this.animated[key] = animated

        this._stopAnimation(key)
      } else {
        console.warn('Given value not animatable:', value)
      }
    }
  } // Listen for all animations to end.

  _onEnd(onEnd) {
    if (this.runCount) this.onEndQueue.push(onEnd)
    else onEnd(true)
  } // Add this controller to the frameloop.

  _start(onEnd) {
    if (onEnd) this._onEnd(onEnd)

    if (this.idle && this.runCount) {
      this.idle = false
      start(this)
    }
  } // Remove this controller from the frameloop, and notify any listeners.

  _stop(finished) {
    this.idle = true
    stop(this)
    const onEndQueue = this.onEndQueue

    if (onEndQueue.length) {
      this.onEndQueue = []
      onEndQueue.forEach(onEnd => onEnd(finished))
    }
  } // Execute the current queue of prop updates.

  _flush(onEnd) {
    const queue = this.queue.reduce(reduceDelays, [])
    this.queue.length = 0 // Track the number of active `_run` calls.

    let runsLeft = Object.keys(queue).length
    this.runCount += runsLeft // Never assume that the last update always finishes last, since that's
    // not true when 2+ async updates have indeterminate durations.

    const onRunEnd = finished => {
      this.runCount--
      if (--runsLeft) return
      if (onEnd) onEnd(finished)

      if (!this.runCount && finished) {
        const onRest = this.props.onRest
        if (onRest) onRest(this.merged)
      }
    }

    queue.forEach((props, delay) => {
      if (delay) setTimeout(() => this._run(props, onRunEnd), delay)
      else this._run(props, onRunEnd)
    })
  } // Update the props and animations

  _run(props, onEnd) {
    if (is.arr(props.to) || is.fun(props.to)) {
      this._runAsync(props, onEnd)
    } else if (this._diff(props)) {
      this._animate(props)._start(onEnd)
    } else {
      this._onEnd(onEnd)
    }
  } // Start an async chain or an async script.

  _runAsync(_ref, onEnd) {
    let to = _ref.to,
      props = _objectWithoutPropertiesLoose(_ref, ['to'])

    // Merge other props immediately.
    if (this._diff(props)) {
      this._animate(props)
    } // Async scripts can be declaratively cancelled.

    if (props.cancel === true) {
      this.props.asyncTo = void 0
      return onEnd(false)
    } // Never run more than one script at a time.

    if (
      !this._diff({
        asyncTo: to,
        timestamp: props.timestamp,
      })
    ) {
      return onEnd(false)
    }

    const animations = this.animations

    const isCancelled = () =>
      // The `stop` and `destroy` methods replace the `animations` map.
      animations !== this.animations || // Async scripts are cancelled when a new chain/script begins.
      (is.fun(to) && to !== this.props.asyncTo)

    let last

    const next = props => {
      if (isCancelled()) throw this
      return (last = new Promise(done => {
        this.update(props).start(done)
      })).then(() => {
        if (isCancelled()) throw this
      })
    }

    let queue = Promise.resolve()

    if (is.arr(to)) {
      to.forEach(props => (queue = queue.then(() => next(props))))
    } else if (is.fun(to)) {
      queue = queue.then(() =>
        to(next, this.stop.bind(this)) // Always wait for the last update.
          .then(() => last)
      )
    }

    queue
      .catch(err => err !== this && console.error(err))
      .then(() => onEnd(!isCancelled()))
  } // Merge every fresh prop. Returns true if one or more props changed.
  // These props are ignored: (config, immediate, reverse)

  _diff(_ref2) {
    let timestamp = _ref2.timestamp,
      config = _ref2.config,
      immediate = _ref2.immediate,
      reverse = _ref2.reverse,
      props = _objectWithoutPropertiesLoose(_ref2, [
        'timestamp',
        'config',
        'immediate',
        'reverse',
      ])

    let changed = false // Ensure the newer timestamp is used.

    const diffTimestamp = keyPath => {
      const previous = this.timestamps[keyPath]

      if (is.und(previous) || timestamp >= previous) {
        this.timestamps[keyPath] = timestamp
        return true
      }

      return false
    } // Generalized diffing algorithm

    const diffProp = (keys, value, parent) => {
      if (is.und(value)) return
      const lastKey = keys[keys.length - 1]

      if (is.obj(value)) {
        if (!is.obj(parent[lastKey])) parent[lastKey] = {}

        for (const key in value) {
          diffProp(keys.concat(key), value[key], parent[lastKey])
        }
      } else if (diffTimestamp(keys.join('.'))) {
        const oldValue = parent[lastKey]

        if (!is.equ(value, oldValue)) {
          changed = true
          parent[lastKey] = value
        }
      }
    }

    if (reverse) {
      const to = props.to
      props.to = props.from
      props.from = is.obj(to) ? to : void 0
    }

    for (const key in props) {
      diffProp([key], props[key], this.props)
    } // These props only affect one update

    if (props.reset) this.props.reset = false
    if (props.cancel) this.props.cancel = false
    return changed
  } // Return true if the given prop was changed by this update

  _isModified(props, prop) {
    return this.timestamps[prop] === props.timestamp
  } // Update the animation configs. The given props override any default props.

  _animate(props) {
    const _this$props = this.props,
      _this$props$from = _this$props.from,
      from = _this$props$from === void 0 ? emptyObj : _this$props$from,
      _this$props$to = _this$props.to,
      to = _this$props$to === void 0 ? emptyObj : _this$props$to,
      attach = _this$props.attach,
      onStart = _this$props.onStart

    let isPrevented = _ => false

    if (props.cancel && this._isModified(props, 'cancel')) {
      // Stop all animations when `cancel` is true
      if (props.cancel === true) {
        return this.stop()
      } // Prevent matching properties from animating when
      // `cancel` is a string or array of strings

      const keys = toArray(props.cancel)

      if (is.arr(keys) && keys.length) {
        isPrevented = key => keys.indexOf(key) >= 0

        this.stop(...keys)
      }
    } // Merge `from` values with `to` values

    this.merged = _extends({}, from, to) // True if any animation was updated

    let changed = false // The animations that are starting or restarting

    const started = [] // Attachment handling, trailed springs can "attach" themselves to a previous spring

    const target = attach && attach(this) // Reduces input { key: value } pairs into animation objects

    for (const key in this.merged) {
      if (isPrevented(key)) continue
      const state = this.animations[key]

      if (!state) {
        console.warn(
          `Failed to animate key: "${key}"\n` +
            `Did you forget to define "from.${key}" for an async animation?`
        )
        continue
      } // Reuse the Animated nodes whenever possible

      let animated = state.animated,
        animatedValues = state.animatedValues
      const value = this.merged[key]
      const goalValue = computeGoalValue(value) // Stop animations with a goal value equal to its current value.

      if (!props.reset && is.equ(goalValue, animated.getValue())) {
        // The animation might be stopped already.
        if (!state.idle) {
          changed = true

          this._stopAnimation(key)
        }

        continue
      } // Replace an animation when its goal value is changed (or it's been reset)

      if (props.reset || !is.equ(goalValue, state.goalValue)) {
        let _ref3 = is.und(props.immediate) ? this.props : props,
          immediate = _ref3.immediate

        immediate = !!callProp(immediate, key)
        const isActive = animatedValues.some(v => !v.done)
        const fromValue = !is.und(from[key])
          ? computeGoalValue(from[key])
          : goalValue // Animatable strings use interpolation

        const isInterpolated = isAnimatableString(value)

        if (isInterpolated) {
          const output = [
            props.reset ? fromValue : animated.getValue(),
            goalValue,
          ]
          let input = animatedValues[0]

          if (input) {
            input.setValue(0, false)
            input.reset(isActive)
          } else {
            input = new AnimatedValue(0)
          }

          try {
            const prev = animated
            animated = input.interpolate({
              output,
            })
            moveChildren(prev, animated)
          } catch (err) {
            console.warn(
              'Failed to interpolate string from "%s" to "%s"',
              output[0],
              output[1]
            )
            console.error(err)
            continue
          }

          if (immediate) {
            input.setValue(1, false)
          }
        } else {
          // Convert values into Animated nodes (reusing nodes whenever possible)
          if (is.arr(value)) {
            if (animated instanceof AnimatedValueArray) {
              if (props.reset) animated.setValue(fromValue, false)
              animatedValues.forEach(v => v.reset(isActive))
            } else {
              const prev = animated
              animated = createAnimated(fromValue)
              moveChildren(prev, animated)
            }
          } else {
            if (animated instanceof AnimatedValue) {
              if (props.reset) animated.setValue(fromValue, false)
              animated.reset(isActive)
            } else {
              const prev = animated
              animated = new AnimatedValue(fromValue)
              moveChildren(prev, animated)
            }
          }

          if (immediate) {
            animated.setValue(goalValue, false)
          }
        } // Only change the "config" of updated animations.

        const config =
          callProp(props.config, key) ||
          callProp(this.props.config, key) ||
          emptyObj

        if (!immediate) {
          started.push(key)
        }

        changed = true
        animatedValues = toArray(animated.getPayload())
        this.animations[key] = {
          key,
          idle: false,
          goalValue,
          toValues: toArray(
            target
              ? target.animations[key].animated.getPayload()
              : (isInterpolated && 1) || goalValue
          ),
          fromValues: animatedValues.map(v => v.getValue()),
          animated,
          animatedValues,
          immediate,
          duration: config.duration,
          easing: withDefault(config.easing, linear),
          decay: config.decay,
          mass: withDefault(config.mass, 1),
          tension: withDefault(config.tension, 170),
          friction: withDefault(config.friction, 26),
          initialVelocity: withDefault(config.velocity, 0),
          clamp: withDefault(config.clamp, false),
          precision: withDefault(config.precision, 0.01),
          config,
        }
      }
    }

    if (changed) {
      if (onStart && started.length) {
        started.forEach(key => onStart(this.animations[key]))
      } // Make animations available to the frameloop

      const configs = (this.configs = [])
      const values = (this.values = {})
      const nodes = (this.animated = {})

      for (const key in this.animations) {
        const config = this.animations[key]
        configs.push(config)
        values[key] = config.animated.getValue()
        nodes[key] = config.animated
      }
    }

    return this
  } // Stop an animation by its key

  _stopAnimation(key) {
    if (!this.animated[key]) return
    const state = this.animations[key]
    if (state && state.idle) return

    let _ref4 = state || emptyObj,
      animated = _ref4.animated,
      animatedValues = _ref4.animatedValues

    if (!state) {
      animated = this.animated[key]
      animatedValues = toArray(animated.getPayload())
    } // Tell the frameloop to stop animating these values

    animatedValues.forEach(v => (v.done = true)) // Prevent any pending updates to this key

    this.timestamps['to.' + key] = now() // The current value becomes the goal value,
    // which ensures the integrity of the diffing algorithm.

    const goalValue = animated.getValue()

    if (this.props.to) {
      this.props.to[key] = goalValue
    } // Remove unused data from this key's animation config

    this.animations[key] = {
      key,
      idle: true,
      goalValue,
      animated,
      animatedValues,
    }
  }
}
/** Wrap any value with an `Animated` node */

function createAnimated(value) {
  return is.arr(value)
    ? new AnimatedValueArray(
        value.map(value => {
          const animated = createAnimated(value)
          const payload = animated.getPayload()
          return animated instanceof AnimatedInterpolation
            ? payload[0]
            : payload
        })
      )
    : isAnimatableString(value)
    ? new AnimatedValue(0).interpolate({
        output: [value, value],
      })
    : new AnimatedValue(value)
}
/**
 * Replace an `Animated` node in the graph.
 * This is most useful for async updates, which don't cause a re-render.
 */

function moveChildren(prev, next) {
  const children = prev.getChildren().slice()
  children.forEach(child => {
    prev.removeChild(child)
    next.addChild(child) // Replace `prev` with `next` in child payloads

    const payload = child.getPayload()

    if (is.arr(payload)) {
      const i = payload.indexOf(prev)

      if (i >= 0) {
        const copy = [...payload]
        copy[i] = next
        child['payload'] = copy
      }
    } else if (is.obj(payload)) {
      const entry = Object.entries(payload).find(entry => entry[1] === prev)

      if (entry) {
        child['payload'] = _extends({}, payload, {
          [entry[0]]: next,
        })
      }
    }
  })
} // Merge updates with the same delay.
// NOTE: Mutation of `props` may occur!

function reduceDelays(merged, props) {
  const prev = merged[props.delay]

  if (prev) {
    props.to = merge(prev.to, props.to)
    props.from = merge(prev.from, props.from)
    Object.assign(prev, props)
  } else {
    merged[props.delay] = props
  }

  return merged
}

function merge(dest, src) {
  return is.obj(dest) && is.obj(src) ? _extends({}, dest, src) : src || dest
} // Not all strings can be animated (eg: {display: "none"})

function isAnimatableString(value) {
  if (!is.str(value)) return false
  return value.startsWith('#') || /\d/.test(value) || !!colorNames[value]
} // Compute the goal value, converting "red" to "rgba(255, 0, 0, 1)" in the process

function computeGoalValue(value) {
  return is.arr(value)
    ? value.map(computeGoalValue)
    : isAnimatableString(value)
    ? interpolation({
        range: [0, 1],
        output: [value, value],
      })(1)
    : value
}

/** API
 * const props = useSprings(number, [{ ... }, { ... }, ...])
 * const [props, set] = useSprings(number, (i, controller) => ({ ... }))
 */

const useSprings = (length, propsArg) => {
  const mounted = useRef(false)
  const ctrl = useRef()
  const isFn = is.fun(propsArg) // The `propsArg` coerced into an array

  const props = isFn ? [] : propsArg // The controller maintains the animation values, starts and stops animations

  const _useMemo = useMemo(() => {
      let ref, controllers
      return [
        // Recreate the controllers whenever `length` changes
        (controllers = fillArray(length, i => {
          const c = new Controller()
          const p = props[i] || (props[i] = callProp(propsArg, i, c))
          if (i === 0) ref = p.ref
          return c.update(p)
        })), // This updates the controllers with new props
        props => {
          const isFn = is.fun(props)
          if (!isFn) props = toArray(props)
          controllers.forEach((c, i) => {
            c.update(isFn ? callProp(props, i, c) : props[i])
            if (!ref) c.start()
          })
        }, // The imperative API is accessed via ref
        ref,
        ref && {
          start: () =>
            Promise.all(controllers.map(c => new Promise(r => c.start(r)))),
          stop: finished => controllers.forEach(c => c.stop(finished)),
          controllers,
        },
      ]
    }, [length]),
    controllers = _useMemo[0],
    setProps = _useMemo[1],
    ref = _useMemo[2],
    api = _useMemo[3] // Attach the imperative API to its ref

  useImperativeHandle(ref, () => api, [api]) // Once mounted, update the local state and start any animations.

  useEffect(() => {
    if (!isFn || ctrl.current !== controllers) {
      controllers.forEach((c, i) => {
        const p = props[i] // Set the default props for async updates

        c.setProp('config', p.config)
        c.setProp('immediate', p.immediate)
      })
    }

    if (ctrl.current !== controllers) {
      if (ctrl.current) ctrl.current.forEach(c => c.destroy())
      ctrl.current = controllers
    }

    if (mounted.current) {
      if (!isFn) setProps(props)
    } else if (!ref) {
      controllers.forEach(c => c.start())
    }
  }) // Update mounted flag and destroy controller on unmount

  useEffect(() => {
    mounted.current = true
    return () => ctrl.current.forEach(c => c.destroy())
  }, []) // Return animated props, or, anim-props + the update-setter above

  const animatedProps = controllers.map(c => c.animated)
  return isFn
    ? [
        animatedProps,
        setProps,
        function() {
          for (
            var _len = arguments.length, args = new Array(_len), _key = 0;
            _key < _len;
            _key++
          ) {
            args[_key] = arguments[_key]
          }

          return ctrl.current.forEach(c => c.stop(...args))
        },
      ]
    : animatedProps
}

/** API
 * const props = useSpring({ ... })
 * const [props, set] = useSpring(() => ({ ... }))
 */

const useSpring = props => {
  const isFn = is.fun(props)

  const _useSprings = useSprings(1, isFn ? props : [props]),
    result = _useSprings[0],
    set = _useSprings[1],
    stop = _useSprings[2]

  return isFn ? [result[0], set, stop] : result
}

/** API
 * const trails = useTrail(number, { ... })
 * const [trails, set] = useTrail(number, () => ({ ... }))
 */

const useTrail = (length, props) => {
  const mounted = useRef(false)
  const isFn = is.fun(props)
  const updateProps = callProp(props)
  const instances = useRef()

  const _useSprings = useSprings(length, (i, ctrl) => {
      if (i === 0) instances.current = []
      instances.current.push(ctrl)
      return _extends({}, updateProps, {
        config: callProp(updateProps.config, i),
        attach: i > 0 && (() => instances.current[i - 1]),
      })
    }),
    result = _useSprings[0],
    set = _useSprings[1],
    stop = _useSprings[2] // Set up function to update controller

  const updateCtrl = useMemo(
    () => props =>
      set((i, ctrl) => {
        const last = props.reverse ? i === 0 : length - 1 === i
        const attachIdx = props.reverse ? i + 1 : i - 1
        const attachController = instances.current[attachIdx]
        return _extends({}, props, {
          config: callProp(props.config || updateProps.config, i),
          attach: !!attachController && (() => attachController),
        })
      }),
    [length, updateProps.config]
  ) // Update controller if props aren't functional

  useEffect(() => void (mounted.current && !isFn && updateCtrl(props))) // Update mounted flag and destroy controller on unmount

  useEffect(() => void (mounted.current = true), [])
  return isFn ? [result, updateCtrl, stop] : result
}

/** API
 * const transitions = useTransition(items, itemKeys, { ... })
 * const [transitions, update] = useTransition(items, itemKeys, () => ({ ... }))
 */

let guid = 0
const INITIAL = 'initial'
const ENTER = 'enter'
const UPDATE = 'update'
const LEAVE = 'leave'

const makeKeys = (items, keys) =>
  (typeof keys === 'function' ? items.map(keys) : toArray(keys)).map(String)

const makeConfig = props => {
  let items = props.items,
    keys = props.keys,
    rest = _objectWithoutPropertiesLoose(props, ['items', 'keys'])

  items = toArray(is.und(items) ? null : items)
  return _extends(
    {
      items,
      keys: makeKeys(items, keys),
    },
    rest
  )
}

function useTransition(input, keyTransform, props) {
  props = makeConfig(
    _extends({}, props, {
      items: input,
      keys: keyTransform || (i => i),
    })
  )

  const _props = props,
    _props$lazy = _props.lazy,
    lazy = _props$lazy === void 0 ? false : _props$lazy,
    _props$unique = _props.unique,
    from = _props.from,
    enter = _props.enter,
    leave = _props.leave,
    update = _props.update,
    onDestroyed = _props.onDestroyed,
    keys = _props.keys,
    items = _props.items,
    onFrame = _props.onFrame,
    _onRest = _props.onRest,
    onStart = _props.onStart,
    ref = _props.ref,
    extra = _objectWithoutPropertiesLoose(_props, [
      'lazy',
      'unique',
      'from',
      'enter',
      'leave',
      'update',
      'onDestroyed',
      'keys',
      'items',
      'onFrame',
      'onRest',
      'onStart',
      'ref',
    ])

  const forceUpdate = useForceUpdate()
  const mounted = useRef(false)
  const state = useRef({
    mounted: false,
    first: true,
    deleted: [],
    current: {},
    transitions: [],
    prevProps: {},
    paused: !!props.ref,
    instances: !mounted.current && new Map(),
    forceUpdate,
  })
  useImperativeHandle(props.ref, () => ({
    start: () =>
      Promise.all(
        Array.from(state.current.instances).map(_ref => {
          let c = _ref[1]
          return new Promise(r => c.start(r))
        })
      ),
    stop: finished =>
      Array.from(state.current.instances).forEach(_ref2 => {
        let c = _ref2[1]
        return c.stop(finished)
      }),

    get controllers() {
      return Array.from(state.current.instances).map(_ref3 => {
        let c = _ref3[1]
        return c
      })
    },
  })) // Update state

  state.current = diffItems(state.current, props)

  if (state.current.changed) {
    // Update state
    state.current.transitions.forEach(transition => {
      const phase = transition.phase,
        key = transition.key,
        item = transition.item,
        props = transition.props
      if (!state.current.instances.has(key))
        state.current.instances.set(key, new Controller()) // Avoid calling `onStart` more than once per transition.

      let started = false // update the map object

      const ctrl = state.current.instances.get(key)

      const itemProps = _extends({}, extra, props, {
        ref,
        onRest: values => {
          if (state.current.mounted) {
            if (transition.destroyed) {
              // If no ref is given delete destroyed items immediately
              if (!ref && !lazy) cleanUp(state, key)
              if (onDestroyed) onDestroyed(item)
            } // A transition comes to rest once all its springs conclude

            const curInstances = Array.from(state.current.instances)
            const active = curInstances.some(_ref4 => {
              let c = _ref4[1]
              return !c.idle
            })

            if (!active && (ref || lazy) && state.current.deleted.length > 0) {
              cleanUp(state)
            }

            if (_onRest) {
              _onRest(item, phase, values)
            }
          }
        },
        onFrame: onFrame && (values => onFrame(item, phase, values)),
        onStart:
          onStart &&
          (animation =>
            started || (started = (onStart(item, phase, animation), true))), // Update controller
      })

      ctrl.update(itemProps)
      if (!state.current.paused) ctrl.start()
    })
  }

  useEffect(() => {
    state.current.mounted = mounted.current = true
    return () => {
      state.current.mounted = mounted.current = false
      Array.from(state.current.instances).map(_ref5 => {
        let c = _ref5[1]
        return c.destroy()
      })
      state.current.instances.clear()
    }
  }, [])
  return state.current.transitions.map(_ref6 => {
    let item = _ref6.item,
      phase = _ref6.phase,
      key = _ref6.key
    return {
      item,
      key,
      phase,
      props: state.current.instances.get(key).animated,
    }
  })
}

function cleanUp(_ref7, filterKey) {
  let state = _ref7.current
  const deleted = state.deleted

  for (let _ref8 of deleted) {
    let key = _ref8.key

    const filter = t => t.key !== key

    if (is.und(filterKey) || filterKey === key) {
      state.instances.delete(key)
      state.transitions = state.transitions.filter(filter)
      state.deleted = state.deleted.filter(filter)
    }
  }

  state.forceUpdate()
}

function diffItems(_ref9, props) {
  let first = _ref9.first,
    current = _ref9.current,
    deleted = _ref9.deleted,
    prevProps = _ref9.prevProps,
    state = _objectWithoutPropertiesLoose(_ref9, [
      'first',
      'current',
      'deleted',
      'prevProps',
    ])

  let items = props.items,
    keys = props.keys,
    initial = props.initial,
    from = props.from,
    enter = props.enter,
    leave = props.leave,
    update = props.update,
    _props$trail = props.trail,
    trail = _props$trail === void 0 ? 0 : _props$trail,
    unique = props.unique,
    config = props.config,
    _props$order = props.order,
    order = _props$order === void 0 ? [ENTER, LEAVE, UPDATE] : _props$order

  let _makeConfig = makeConfig(prevProps),
    _keys = _makeConfig.keys,
    _items = _makeConfig.items

  if (props.reset) {
    current = {}
    state.transitions = []
  } // Compare next keys with current keys

  const currentKeys = Object.keys(current)
  const currentSet = new Set(currentKeys)
  const nextSet = new Set(keys)
  const addedKeys = keys.filter(key => !currentSet.has(key))
  const updatedKeys = update ? keys.filter(key => currentSet.has(key)) : []
  const deletedKeys = state.transitions
    .filter(t => !t.destroyed && !nextSet.has(t.originalKey))
    .map(t => t.originalKey)
  let delay = -trail

  while (order.length) {
    let phase = order.shift()

    if (phase === ENTER) {
      if (first && !is.und(initial)) {
        phase = INITIAL
        from = initial
      }

      addedKeys.forEach(key => {
        // In unique mode, remove fading out transitions if their key comes in again
        if (unique && deleted.find(d => d.originalKey === key)) {
          deleted = deleted.filter(t => t.originalKey !== key)
        }

        const i = keys.indexOf(key)
        const item = items[i]
        const enterProps = callProp(enter, item, i)
        current[key] = {
          phase,
          originalKey: key,
          key: unique ? String(key) : guid++,
          item,
          props: _extends(
            {
              delay: (delay += trail),
              config: callProp(config, item, phase),
              from: callProp(from, item),
              to: enterProps,
            },
            is.obj(enterProps) && interpolateTo(enterProps)
          ),
        }
      })
    } else if (phase === LEAVE) {
      deletedKeys.forEach(key => {
        const i = _keys.indexOf(key)

        const item = _items[i]
        const leaveProps = callProp(leave, item, i)
        deleted.push(
          _extends({}, current[key], {
            phase,
            destroyed: true,
            left: _keys[i - 1],
            right: _keys[i + 1],
            props: _extends(
              {
                delay: (delay += trail),
                config: callProp(config, item, phase),
                to: leaveProps,
              },
              is.obj(leaveProps) && interpolateTo(leaveProps)
            ),
          })
        )
        delete current[key]
      })
    } else if (phase === UPDATE) {
      updatedKeys.forEach(key => {
        const i = keys.indexOf(key)
        const item = items[i]
        const updateProps = callProp(update, item, i)
        current[key] = _extends({}, current[key], {
          phase,
          props: _extends(
            {
              delay: (delay += trail),
              config: callProp(config, item, phase),
              to: updateProps,
            },
            is.obj(updateProps) && interpolateTo(updateProps)
          ),
        })
      })
    }
  }

  let out = keys.map(key => current[key])
  out = reconcileDeleted(deleted, out)
  return _extends({}, state, {
    first: first && !addedKeys.length,
    changed: !!(addedKeys.length || deletedKeys.length || updatedKeys.length),
    transitions: out,
    current,
    deleted,
    prevProps: props,
  })
}

function Spring(_ref) {
  let children = _ref.children,
    props = _objectWithoutPropertiesLoose(_ref, ['children'])

  const spring = useSpring(props)
  return children(spring)
}
function Trail(_ref2) {
  let items = _ref2.items,
    children = _ref2.children,
    props = _objectWithoutPropertiesLoose(_ref2, ['items', 'children'])

  const trails = useTrail(items.length, props)
  return items.map((item, index) => children(item)(trails[index]))
}
function Transition(_ref3) {
  let items = _ref3.items,
    _ref3$keys = _ref3.keys,
    keys = _ref3$keys === void 0 ? null : _ref3$keys,
    children = _ref3.children,
    props = _objectWithoutPropertiesLoose(_ref3, ['items', 'keys', 'children'])

  const transitions = useTransition(items, keys, props)
  return transitions.map((_ref4, index) => {
    let item = _ref4.item,
      key = _ref4.key,
      props = _ref4.props,
      slot = _ref4.slot
    const el = children(item, slot, index)(props)
    return React.createElement(
      el.type,
      _extends(
        {
          key: key,
        },
        el.props
      )
    )
  })
}

// Solution: https://stackoverflow.com/questions/638565/parsing-scientific-notation-sensibly/658662

const stringShapeRegex = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g

const createStringInterpolator$1 = config$$1 => {
  const outputRange = config$$1.output
  const outputRanges = outputRange[0].match(stringShapeRegex).map(() => [])
  outputRange.forEach(value => {
    value
      .match(stringShapeRegex)
      .forEach((number, i) => outputRanges[i].push(+number))
  })
  const interpolations = outputRange[0].match(stringShapeRegex).map((_, i) =>
    createInterpolator(
      _extends({}, config$$1, {
        output: outputRanges[i],
      })
    )
  )
  return input => {
    let i = 0
    return outputRange[0].replace(stringShapeRegex, () =>
      interpolations[i++](input)
    )
  }
}

assign({
  createStringInterpolator: createStringInterpolator$1,
  applyAnimatedValues: () => false,
})
const animatedFn = withExtend(createAnimatedComponent)
/** @deprecated Use `animated.extend` instead */

const apply = animatedFn.extend
const Interpolation = {
  create: createInterpolator,
}

export {
  apply,
  config,
  animatedFn as animated,
  animatedFn as a,
  interpolate$1 as interpolate,
  Globals,
  useSpring,
  useTrail,
  useTransition,
  useChain,
  useSprings,
  Interpolation,
  Spring,
  Trail,
  Transition,
}
