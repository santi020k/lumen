const obj = { focus: () => console.log('focused') };
const foo = () => {
  console.log('openSelect')
  
  if (true) {
    (obj)?.focus()
  }
}
foo();
