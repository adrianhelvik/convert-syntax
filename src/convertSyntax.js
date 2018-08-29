import splitFirst from './splitFirst'
import JSON from 'circular-json'
import assert from 'assert'

const validRuleTypes = [
  'sequence',
  'optional',
  'many',
  'one_plus',
  'zero_plus',
  'one',
  'either',
  'all',
]

function convertSyntax(syntax) {
  const rulesMap = new Map()
  const shallowRules = []

  for (const ruleSchema of syntax.lex) {
    addLexRule(ruleSchema)
  }

  for (const type of Object.keys(syntax.parse))
    addShallowParseRule(type, syntax.parse[type])

  for (const rule of shallowRules)
    populateRule(rule)

  return rulesMap.get('main')

  function addLexRule(ruleSchema) {
    const type = ruleSchema[0]
    rulesMap.set(type, {
      type,
      ruleType: 'lex',
    })
  }

  function addShallowParseRule(type, ruleSchema) {
    const rule = {
      ruleType: ruleSchema[0],
      type,
      ruleSchema,
    }
    rulesMap.set(type, rule)
    shallowRules.push(rule)
  }

  function populateRule(rule) {
    if (! rule.ruleSchema)
      return

    switch (rule.ruleType) {
      case 'either':
      case 'sequence':
        populateMultiRule(rule)
        break
      case 'one':
        populateOneRule(rule)
        break
      case 'many':
        populateManyRule(rule)
        break
      case 'zero_plus':
        populateZeroPlus(rule)
        break
      case 'one_plus':
        populateOnePlus(rule)
        break
      case 'optional':
        populateOptionalRule(rule)
        break
      case 'all':
        populateAll(rule)
        break
      default:
        throw Error(`Unknown rule type: "${rule.ruleType}" in rule ${JSON.stringify(rule)}`)
    }

    delete rule.ruleSchema
  }

  function populateAll(rule) {
    const { ruleSchema } = rule
    const subType = ruleSchema[1]

    rule.subRule = lookupRule(subType)
  }

  function populateOptionalRule(rule) {
    const { ruleSchema } = rule
    const subType = ruleSchema[1]

    rule.subRule = lookupRule(subType)
  }

  function populateManyRule(rule) {
    const { ruleSchema } = rule
    const subType = ruleSchema[1]
    const delimiter = ruleSchema[2]

    rule.subRule = lookupRule(subType)

    if (delimiter) {
      rule.delimiter = lookupRule(delimiter)
    }
  }

  function populateOneRule(rule) {
    const { ruleSchema } = rule
    const subType = ruleSchema[1]

    rule.subRule = lookupRule(subType)
  }

  function populateZeroPlus(rule) {
    const { ruleSchema } = rule
    const subType = ruleSchema[1]
    const delimiter = ruleSchema[2]

    rule.subRule = lookupRule(subType)

    if (delimiter)
      rule.delimiter = lookupRule(delimiter)
  }

  function populateOnePlus(rule) {
    const { ruleSchema } = rule
    const subType = ruleSchema[1]
    const delimiter = ruleSchema[2]

    rule.subRule = lookupRule(subType)

    if (delimiter)
      rule.delimiter = lookupRule(delimiter)
  }

  function populateMultiRule(rule) {
    const subType = rule.ruleSchema[1]
    rule.subRule = []

    assert(Array.isArray(subType), `Expected subType to be an array. Got ${JSON.stringify(subType)} in rule: ${JSON.stringify(rule)}`)

    for (const part of subType) {
      if (typeof part === 'string') {
        if (part === 'VERIFIED') {
          rule.subRule.push({ ruleType: 'verified' })
        } else {
          let subRule = lookupRule(part)
          rule.subRule.push(subRule)
        }
      } else {
        const subRule = {
          ruleType: part[0],
          ruleSchema: part,
          type: 'anonymous',
        }
        rule.subRule.push(subRule)
        populateRule(subRule)
      }
    }
  }

  function lookupRule(x) {
    if (! x)
      throw Error('Cannot lookup ' + x)

    if (Array.isArray(x)) {
      if (! validRuleTypes.includes(x[0]))
        throw Error(x[0] + ' is not a valid rule type. Maybe you used an array where you should have used a string?')
      const rule = {
        ruleType: x[0],
        type: 'anonymous',
        ruleSchema: x,
      }
      populateRule(rule)
      return rule
    }

    const [key, value] = splitFirst(x, ':')
    let subRule

    if (value) {
      if (! rulesMap.has(key))
        throw Error(`Failed to lookup rule ${key} from type:value pair "${key}:${value}"`)
      subRule = Object.create(rulesMap.get(key))
      if (subRule)
        subRule.value = value
    } else {
      subRule = rulesMap.get(x)
    }

    if (! subRule)
      throw Error(`lookupRule: Failed to lookup rule: ${JSON.stringify(key)}`)

    return subRule
  }
}

export default convertSyntax
