import * as types from '../constants/action-types'

function groups(state = {}, action = {}) {
  let _groups = {}
  switch (action.type) {
    case types.FETCH_TAGS_REQUEST:
    case types.FETCH_CATEGORIES_REQUEST:
      action.groups.map((group) => {
        _groups[group] = {
          error: null,
          isFetching: true
        }
      })
      return Object.assign({}, state, _groups)
    case types.FETCH_TAGS_FAILURE:
    case types.FETCH_CATEGORIES_FAILURE:
      action.groups.map((group) => {
        _groups[group] = {
          error: action.error,
          isFetching: false,
          lastUpdated: action.failedAt
        }
      })
      return Object.assign({}, state, _groups)
    case types.FETCH_TAGS_SUCCESS:
    case types.FETCH_CATEGORIES_SUCCESS:
      let entities
      if (action.type === types.FETCH_TAGS_SUCCESS) {
        entities = action.response.entities.tags
      } else {
        entities = action.response.entities.categories
      }

      Object.keys(entities).map((entityId) => {
        _groups[entities[entityId].name] = {
          id: entityId,
          error: null,
          isFetching: false,
          lastUpdated: action.receivedAt
        }
      })
      return Object.assign({}, state, _groups)
    default:
      return state
  }
}

export function tags(state = {}, action = {}) {
  switch(action.type) {
    case types.FETCH_TAGS_REQUEST:
    case types.FETCH_TAGS_FAILURE:
    case types.FETCH_TAGS_SUCCESS:
      return groups(state, action)
    default:
      return state
  }
}

export function categories(state = {}, action = {}) {
  switch(action.type) {
    case types.FETCH_CATEGORIES_REQUEST:
    case types.FETCH_CATEGORIES_FAILURE:
    case types.FETCH_CATEGORIES_SUCCESS:
      return groups(state, action)
    default:
      return state
  }
}