import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  Card,
  CardActions,
  CardContent,
  CardSection,
  Button,
  Tag,
  Row,
  Col,
  CheckboxGroup,
} from 'former-kit'

import Form from 'react-vanilla-form'

import ChevronDown32 from 'emblematic-icons/svg/ChevronDown32.svg'
import ChevronUp32 from 'emblematic-icons/svg/ChevronUp32.svg'

import {
  allPass,
  anyPass,
  complement,
  either,
  equals,
  flatten,
  identity,
  ifElse,
  isEmpty,
  isNil,
  unless,
  is,
  of,
  join,
  map,
  mergeDeepLeft,
  pipe,
  values,
} from 'ramda'

import moment from 'moment'

import compileTags from './compileTags'
import style from './style.css'

const isNilOrEmpty = anyPass([isNil, isEmpty])

const getFilters = pipe(
  mergeDeepLeft,
  values,
  flatten
)

const ensureArray = unless(
  is(Array),
  of
)

const isDate = either(is(Date), moment.isMoment)

const formatIfDate = ifElse(
  isDate,
  date => moment(date).format('MM/DD/YYYY HH:mm:ss'),
  identity
)

const isNotDateObject = allPass([
  is(Object),
  complement(is(String)),
  complement(isDate),
])

export const stringifyDates = ifElse(
  isNotDateObject,
  map(property => stringifyDates(property)),
  formatIfDate
)

class Filters extends Component {
  constructor (props) {
    super(props)

    this.state = {
      collapsed: true,
      hasChanged: false,
      query: props.query,
    }

    this.renderChildrenInput = this.renderChildrenInput.bind(this)
    this.handleToogeMoreFilters = this.handleToogeMoreFilters.bind(this)
    this.handleFiltersSubmit = this.handleFiltersSubmit.bind(this)
    this.handleFiltersChange = this.handleFiltersChange.bind(this)
  }

  componentDidUpdate (prevProps, prevState) {
    const { query } = this.props

    const prevQuery = stringifyDates(prevState.query)
    const currQuery = stringifyDates(query)

    if (!equals(prevQuery, currQuery)) {
      this.setState({ // eslint-disable-line react/no-did-update-set-state
        hasChanged: true,
        query,
      })
    }
  }

  handleToogeMoreFilters () {
    this.setState(({ collapsed }) => ({
      collapsed: !collapsed,
    }))
  }

  handleFiltersSubmit (filters) {
    const { onConfirm } = this.props

    this.setState({
      collapsed: true,
      hasChanged: false,
    })

    onConfirm(filters)
  }

  handleFiltersChange (query) {
    const { onChange } = this.props

    this.setState({ query })

    onChange(query)
  }

  renderChildrenInput (input, index) {
    const { disabled } = this.props

    return React.cloneElement(input, {
      className: style.search,
      disabled,
      key: `${input.props.name}-${index}`,
    })
  }

  renderToolbar () {
    const {
      children,
      clearFilterDisabled,
      confirmationDisabled,
      disabled,
      onClear,
      options,
      t,
    } = this.props

    const {
      collapsed,
      hasChanged,
    } = this.state

    return (
      <CardActions>
        {ensureArray(children).map(this.renderChildrenInput)}
        {!isNilOrEmpty(options)
          && (
            <Button
              disabled={disabled}
              relevance="low"
              fill="outline"
              iconAlignment="end"
              icon={collapsed
                ? <ChevronDown32 width={16} height={16} />
                : <ChevronUp32 width={16} height={16} />
              }
              onClick={this.handleToogeMoreFilters}
            >
              {t('components.filter.more')}
            </Button>
          )
        }
        <Button
          relevance={
            hasChanged
              ? 'normal'
              : 'low'
          }
          onClick={onClear}
          fill="outline"
          disabled={clearFilterDisabled || disabled}
        >
          {t('components.filter.reset')}
        </Button>

        <Button
          relevance={
            hasChanged
              ? 'normal'
              : 'low'
          }
          disabled={confirmationDisabled || !hasChanged || disabled}
          type="submit"
          fill="gradient"
        >
          {t('components.filter.apply')}
        </Button>
      </CardActions>
    )
  }

  renderOptions () {
    const {
      collapsed,
      query,
    } = this.state

    const {
      disabled,
      options,
      query: {
        filters,
      },
    } = this.props

    if (isNilOrEmpty(options) || collapsed) {
      return null
    }

    const selectedFilters = getFilters(filters, query.filters)

    return (
      <CardContent>
        <CardSection>
          <CardContent>
            <fieldset name="filters">
              <Row flex>
                {options.map(({ items, key, name }) => (
                  <Col key={name}>
                    <div className={style.filtersTitle}>
                      {name}
                    </div>
                    <CheckboxGroup
                      columns={
                        items.length > 6
                          ? 2
                          : 1
                      }
                      disabled={disabled}
                      name={key}
                      options={items}
                      value={selectedFilters}
                    />
                  </Col>
                ))}
              </Row>
            </fieldset>
          </CardContent>
        </CardSection>
      </CardContent>
    )
  }

  renderTags () {
    const {
      collapsed,
      query: {
        filters: localFilters,
      },
    } = this.state

    const {
      options,
      query: {
        filters: urlFilters,
      },
      t,
    } = this.props

    const filters = mergeDeepLeft(urlFilters, localFilters)

    if (!collapsed || isNilOrEmpty(filters)) {
      return null
    }

    const tags = compileTags(options, filters)

    return (
      <CardContent className={style.selectedOptionsTags}>
        <span className={style.selectedOptionsTitle}>
          {t('components.filter.filtering_by')}&nbsp;
        </span>
        {tags.map(({ items, key, name }) => (
          !isNilOrEmpty(items)
            && (
              <Tag key={key}>
                <strong>{name}</strong>: {join(', ', items)}
              </Tag>
            )
        ))}
      </CardContent>
    )
  }

  render () {
    const { query } = this.state

    return (
      <Card className={style.allowOverflow}>
        <Form
          data={query}
          onChange={this.handleFiltersChange}
          onSubmit={this.handleFiltersSubmit}
        >
          {this.renderToolbar()}
          {this.renderOptions()}
          {this.renderTags()}
        </Form>
      </Card>
    )
  }
}

Filters.propTypes = {
  children: PropTypes.node.isRequired,
  clearFilterDisabled: PropTypes.bool,
  confirmationDisabled: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onClear: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    items: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    })),
    key: PropTypes.string,
    name: PropTypes.string,
  })),
  query: PropTypes.object, // eslint-disable-line
  t: PropTypes.func.isRequired,
}

Filters.defaultProps = {
  clearFilterDisabled: false,
  confirmationDisabled: false,
  disabled: false,
  onChange: () => null,
  options: [],
  query: {},
}

export default Filters
