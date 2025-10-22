declare module 'react-map-gl' {
  import { ComponentType } from 'react'

  export interface MapProps {
    ref?: any
    initialViewState?: {
      longitude: number
      latitude: number
      zoom: number
    }
    style?: React.CSSProperties
    mapStyle?: string
    mapboxAccessToken?: string
    children?: React.ReactNode
  }

  export interface MarkerProps {
    longitude: number
    latitude: number
    anchor?: string
    children?: React.ReactNode
  }

  export interface SourceProps {
    id: string
    type: string
    data: any
    children?: React.ReactNode
  }

  export interface LayerProps {
    id: string
    type: string
    paint?: any
  }

  export interface NavigationControlProps {
    position?: string
  }

  const Map: ComponentType<MapProps>
  export const Marker: ComponentType<MarkerProps>
  export const Source: ComponentType<SourceProps>
  export const Layer: ComponentType<LayerProps>
  export const NavigationControl: ComponentType<NavigationControlProps>

  export default Map
}
