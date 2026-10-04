'use client'

// cspell:words nativa país teléfono período Semana

import { createElement, useEffect, useState } from 'react'

import { Alert, Card, Field, Input, Label, NativeSelect, PhoneInput, Segmented, Select, Stack, Typography } from '@santi020k/lumen-react'

const choices = [{ label: 'Activo', value: 'active' }, { label: 'Pendiente', value: 'pending' }]
const sizes = ['sm', 'default', 'lg'] as const

export default function ControlSizesPage() {
  const [elementsError, setElementsError] = useState(false)

  useEffect(() => {
    void import('@santi020k/lumen-elements/define').then(({ defineLumenElements }) => {
      defineLumenElements(['Input', 'NativeSelect', 'Select', 'PhoneInput', 'Segmented'])

      return true
    }).catch(() => {
      setElementsError(true)
    })
  }, [])

  return (
    <Stack as="main" className="visual-host" gap="section" lang="es">
      <Typography><h1>Visual form sizes</h1></Typography>
      {elementsError && <Alert role="alert">Elements preview unavailable</Alert>}
      {sizes.map(visualSize => (
        <Card key={visualSize}>
          <Typography><h2>{visualSize}</h2></Typography>
          <Stack gap="group" data-visual-size={visualSize}>
            <Field>
              <Label htmlFor={`react-input-${visualSize}`}>React nombre</Label>
              <Input id={`react-input-${visualSize}`} size={12} visualSize={visualSize} defaultValue="Santiago" />
            </Field>
            <Field>
              <Label htmlFor={`react-native-${visualSize}`}>React selección nativa</Label>
              <NativeSelect id={`react-native-${visualSize}`} size={2} visualSize={visualSize}>
                {choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
              </NativeSelect>
            </Field>
            <Select aria-label={`React estado ${visualSize}`} visualSize={visualSize} options={choices} defaultValue="active" />
            <PhoneInput id={`react-phone-${visualSize}`} countryLabel={`React país ${visualSize}`} inputProps={{ 'aria-label': `React teléfono ${visualSize}` }} visualSize={visualSize} defaultCountryValue="CO" locale="es-CO" placeholder="Número de teléfono" invalidNumberMessage="Revisa el número de teléfono" />
            <Segmented aria-label={`React período ${visualSize}`} visualSize={visualSize} options={['Día', 'Semana']} defaultValue="Día" />
            {createElement('lumen-select', { 'visual-size': visualSize, 'data-sized-select': visualSize }, createElement('select', { 'aria-label': `Elements estado ${visualSize}` }, choices.map(choice => createElement('option', { key: choice.value, value: choice.value }, choice.label))))}
            {createElement('lumen-phone-input', { 'visual-size': visualSize, country: 'CO', 'country-label': `Elements país ${visualSize}`, 'number-label': `Elements teléfono ${visualSize}`, placeholder: 'Número de teléfono' })}
            {createElement('lumen-segmented', { 'visual-size': visualSize, 'aria-label': `Elements período ${visualSize}` }, createElement('label', { className: 'ui-segmented__option' }, createElement('input', { className: 'ui-segmented__input', name: `elements-period-${visualSize}`, type: 'radio', value: 'day', defaultChecked: true }), createElement('span', { className: 'ui-segmented__label' }, 'Día')), createElement('label', { className: 'ui-segmented__option' }, createElement('input', { className: 'ui-segmented__input', name: `elements-period-${visualSize}`, type: 'radio', value: 'week' }), createElement('span', { className: 'ui-segmented__label' }, 'Semana')))}
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}
