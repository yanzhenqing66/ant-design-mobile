import { NativeProps, withNativeProps } from '../../utils/native-props'
import { useInitialized } from '../../utils/use-initialized'
import React, { useMemo, useRef, useState } from 'react'
import { useLockScroll } from '../../utils/use-lock-scroll'
import { useSpring, animated } from '@react-spring/web'
import { renderToContainer } from '../../utils/render-to-container'
import { mergeProps } from '../../utils/with-default-props'
import { useConfig } from '../config-provider'

const classPrefix = `adm-mask`

const opacityRecord = {
  default: 0.55,
  thin: 0.35,
  thick: 0.75,
}

export type MaskProps = {
  visible?: boolean
  onMaskClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  destroyOnClose?: boolean
  forceRender?: boolean
  disableBodyScroll?: boolean
  color?: 'black' | 'white'
  opacity?: 'default' | 'thin' | 'thick' | number
  getContainer?: HTMLElement | (() => HTMLElement) | null
  afterShow?: () => void
  afterClose?: () => void
} & NativeProps

const defaultProps = {
  visible: true,
  destroyOnClose: false,
  forceRender: false,
  color: 'black',
  opacity: 'default',
  disableBodyScroll: true,
  getContainer: null,
}

export const Mask: React.FC<MaskProps> = p => {
  const props = mergeProps(defaultProps, p)
  const initialized = useInitialized(props.visible || props.forceRender)
  const { locale } = useConfig()

  const ref = useRef<HTMLDivElement>(null)

  useLockScroll(ref, props.visible && props.disableBodyScroll)

  const background = useMemo(() => {
    const opacity = opacityRecord[props.opacity] ?? props.opacity
    const rgb = props.color === 'white' ? '255, 255, 255' : '0, 0, 0'
    return `rgba(${rgb}, ${opacity})`
  }, [props.color, props.opacity])

  const [active, setActive] = useState(props.visible)

  const { opacity } = useSpring({
    opacity: props.visible ? 1 : 0,
    config: {
      precision: 0.01,
      mass: 1,
      tension: 200,
      friction: 30,
    },
    onStart: () => {
      setActive(true)
    },
    onRest: () => {
      setActive(props.visible)
      if (props.visible) {
        props.afterShow?.()
      } else {
        props.afterClose?.()
      }
    },
  })

  const node = withNativeProps(
    props,
    <animated.div
      className={classPrefix}
      ref={ref}
      style={{
        ...props.style,
        background,
        opacity,
        display: active ? 'unset' : 'none',
      }}
    >
      {props.onMaskClick && (
        <div
          className={`${classPrefix}-aria-button`}
          role='button'
          aria-label={locale.Mask.name}
          onClick={props.onMaskClick}
        />
      )}
      <div className={`${classPrefix}-content`}>
        {initialized && active && props.children}
      </div>
    </animated.div>
  )

  return renderToContainer(props.getContainer, node)
}
