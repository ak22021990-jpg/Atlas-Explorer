let total = 0;
let failed = 0;

export function suite(name) {
  console.log(`\n${name}`);
}

export function test(name, fn) {
  total += 1;
  try {
    fn();
    console.log(`  ok ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  fail ${name}`);
    console.error(`    ${error.message}`);
  }
}

export function assert(value, message = 'Expected value to be truthy') {
  if (!value) throw new Error(message);
}

export function assertEqual(actual, expected, message = 'Values are not equal') {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${expected}, received ${actual}`);
  }
}

export function assertDeepEqual(actual, expected, message = 'Values are not deeply equal') {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}. Expected ${expectedJson}, received ${actualJson}`);
  }
}

export function summary() {
  console.log(`\n${total - failed}/${total} tests passed`);
  if (failed > 0) process.exit(1);
}
