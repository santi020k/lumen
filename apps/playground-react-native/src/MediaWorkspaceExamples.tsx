import { useState } from 'react'
import { Image, View } from 'react-native'

import { LumenButton, LumenMediaFilmstrip, LumenMediaThumbnail, LumenMediaViewport } from '@santi020k/lumen-react-native'

const afterImage = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAIAAAAUMWhjAAAAJElEQVR4nGPQSLlEU8QwasGoBaMWjFowasGoBaMWjFowNCwAAFrDGj0TBRDqAAAAAElFTkSuQmCC' }
const beforeImage = afterImage

export const MediaWorkspaceExamples = ({ isVisible }: { isVisible: (name: string) => boolean }) => {
  const [viewport, setViewport] = useState({ zoom: 1, x: 0, y: 0 })
  const [selected, setSelected] = useState(true)

  return (
    <>
      {isVisible('Media viewport') && <View testID="component-media-viewport"><LumenMediaViewport label="Inspect landscape" value={viewport} onValueChange={setViewport}><Image source={afterImage} style={{ width: '100%', height: '100%' }} /></LumenMediaViewport></View>}
      {isVisible('Media thumbnail') && <View testID="component-media-thumbnail" style={{ width: 160 }}><LumenMediaThumbnail label="Landscape" selected={selected} order={1} onSelectionChange={setSelected}><Image source={afterImage} style={{ width: '100%', height: '100%' }} /></LumenMediaThumbnail></View>}
      {isVisible('Media filmstrip') && (
        <View testID="component-media-filmstrip">
          <LumenMediaFilmstrip label="Photos" selectionLabel={`${selected ? 1 : 0} selected`}>
            <View style={{ width: 160 }}>
              <LumenMediaThumbnail label="Landscape" selected={selected} order={1} onSelectionChange={setSelected}><Image source={afterImage} style={{ width: '100%', height: '100%' }} /></LumenMediaThumbnail>
              <LumenButton disabled>Move earlier</LumenButton>
            </View>
            <View style={{ width: 160 }}>
              <LumenMediaThumbnail label="Unavailable photo" selected={false} state="error" stateLabel="Could not load preview" onSelectionChange={() => undefined}><Image source={beforeImage} style={{ width: '100%', height: '100%' }} /></LumenMediaThumbnail>
              <LumenButton disabled>Move later</LumenButton>
            </View>
          </LumenMediaFilmstrip>
        </View>
      )}
    </>
  )
}
