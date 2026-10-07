import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenBreadcrumb, LumenCheckbox, LumenText } from '@santi020k/lumen-react-native'

export const BreadcrumbParityExample = (): ReactElement => {
  const [disabled, setDisabled] = useState(false)
  const [spanish, setSpanish] = useState(false)
  const [longPath, setLongPath] = useState(false)
  const [lastId, setLastId] = useState('none')

  const items = [
    { id: 'home', label: spanish ? 'Inicio' : 'Home' },
    { id: 'library', label: spanish ? 'Biblioteca' : 'Library' },
    { id: 'locked', label: spanish ? 'Archivo bloqueado' : 'Locked archive', disabled: true },
    ...(longPath ?
      [
        { id: 'platforms', label: spanish ? 'Plataformas y componentes compartidos' : 'Platforms and shared components' },
        { id: 'guides', label: spanish ? 'Guías de navegación accesible' : 'Accessible navigation guides' }
      ] :
      []),
    { id: 'current', label: spanish ? 'Ruta actual' : 'Current location' }
  ]

  return (
    <View>
      <LumenCheckbox label="Disable trail" checked={disabled} onCheckedChange={setDisabled} />
      <LumenCheckbox label="Long trail" checked={longPath} onCheckedChange={setLongPath} />
      <LumenCheckbox label="Español" checked={spanish} onCheckedChange={setSpanish} />
      <LumenBreadcrumb
        label={spanish ? 'Ubicación' : 'Location'}
        currentLabel={spanish ? 'Página actual' : 'Current page'}
        items={items}
        disabled={disabled}
        onNavigate={setLastId}
      />
      <LumenText>{`Host navigation ID: ${lastId}`}</LumenText>
    </View>
  )
}
