import ArticleComponent from '@twreporter/react-article-components'
import ArticlePlaceholder from '../components/article/placeholder'
import Helmet from 'react-helmet'
import loggerFactory from '../logger'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import ReadingProgress from '../components/article/reading-progress'
import SystemError from '../components/SystemError'
import siteMeta from '../constants/site-meta'
import twreporterRedux from '@twreporter/redux'
import { connect } from 'react-redux'
import { date2yyyymmdd } from '@twreporter/core/lib/utils/date'
import uiManager from '../managers/ui-manager'
// dependencies of article component v2
import { Link } from 'react-router-dom'
// lodash
import filter from 'lodash/filter'
import get from 'lodash/get'
import throttle from 'lodash/throttle'
import uniqBy from 'lodash/uniqBy'

const _ = {
  filter,
  get,
  throttle,
  uniqBy
}

const { actions, actionTypes, reduxStateFields, utils } = twreporterRedux
const { fetchAFullPost } = actions

const _fontLevel = {
  small: 'small'
}

const logger = loggerFactory.getLogger()

class Article extends PureComponent {
  constructor(props) {
    super(props)
    // WORKAROUND
    // In fact, `fontLevel` is already in this.props, which is passed by `mapStateToProps` function.
    // However, since in `src/client.js`, we use `ReactDOM.hydrate` to render HTML on production environment.
    // `ReactDOM.hydrate` won't re-render the client side HTML string(checksum might be different from HTML string generated by SSR).
    // Hence, we `setState(fontLevel: updatedFontLevel)` after `componentDidMount` to
    // make HTML re-rendered.
    this.state = {
      fontLevel: 'small'
    }

    this.handleScroll = _.throttle(this._handleScroll, 300).bind(this)
    this.handleFontLevelChange = this._handleFontLevelChange.bind(this)

    this._rp = React.createRef()
    this._articleBody = React.createRef()
  }

  componentDidMount() {
    // detect scroll position
    window.addEventListener('scroll', this.handleScroll)
    // WORKAROUND
    // see the above WORKAROUND comments
    const { fontLevel, match } = this.props
    this.setState({
      fontLevel
    })
    const slug = _.get(match, 'params.slug')
    return this.fetchAFullPostWithCatch(slug)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  }

  componentDidUpdate(prevProps) {
    const { match } = this.props
    const slugInParams = _.get(match, 'params.slug')
    const isFetching = _.get(this.props, 'selectedPost.isFetching')
    if (slugInParams !== _.get(prevProps, 'selectedPost.slug') && !isFetching) {
      return this.fetchAFullPostWithCatch(slugInParams)
    }
  }

  fetchAFullPostWithCatch = (slug) => {
    return this.props.fetchAFullPost(slug)
    // TODO show alert message for users
      .catch((failAction) => {
        logger.errorReport({
          report: _.get(failAction, 'payload.error'),
          message: `Error to fetch a full post, post slug: '${slug}'.`
        })
      })
  }

  /**
   * Calculating the reading progress percentage.
   *
   * @param {number} top - the distance between the top of the element and the viewport top.
   * @param {number} height - the element's height
   */
  _handleReadingPercentage(top, height) {
    if (this._rp.current) {
      let scrollRatio = 0
      // top is less than 0,
      // which means the element is in the viewport now
      if (top < 0) {
        scrollRatio = Math.abs(top) / height
      }
      const curPercent = Math.round(scrollRatio * 100)
      // update the header progress bar
      this._rp.current.updatePercentage(curPercent)
    }
  }

  _handleScroll() {
    if (this._articleBody.current) {
      // top will be the distance between the top of body and the viewport top
      // bottom will be the distance between the bottom of body and the viewport top
      // height is the height of articleBody
      const { top, height } = this._articleBody.current.getBoundingClientRect()
      // render reading progress percentage
      this._handleReadingPercentage(top, height)
    }
  }

  _handleFontLevelChange(fontLevel) {
    const { changeFontLevel } = this.props
    this.setState({
      fontLevel
    }, () => {
      changeFontLevel(fontLevel)
    })
  }

  render() {
    const { entities, match, selectedPost } = this.props
    const { fontLevel } = this.state
    const error = _.get(selectedPost, 'error')
    if (error) {
      return (
        <div>
          <SystemError error={error} />
        </div>
      )
    }

    if (_.get(selectedPost, 'slug') !== _.get(match, 'params.slug')) {
      return null
    }

    const postEntities = _.get(entities, reduxStateFields.postsInEntities)
    const topicEntities = _.get(entities, reduxStateFields.topicsInEntities)
    const slug = _.get(selectedPost, 'slug', '')
    const isFetching = _.get(selectedPost, 'isFetching')
    const article = _.get(postEntities, slug, {})
    article.style = uiManager.getArticleV2Style(article.style)

    // prepare related posts and that topic which post belongs to
    // for v2 article
    const postRelateds = utils.denormalizePosts(_.get(article, 'relateds', []), postEntities)
    const postTopic = _.get(utils.denormalizeTopics(_.get(article, 'topics', []), topicEntities, postEntities), '0', {})
    const topicRelateds = _.get(postTopic, 'relateds', [])
    const relatedPosts = _.filter(_.uniqBy([ ...postRelateds, ...topicRelateds ], 'id'),
      (related) => { return related.id !== article.id})

    // for head tag
    const canonical = siteMeta.urlOrigin + '/a/' + slug
    const ogTitle = (_.get(article, 'og_title', '') || _.get(article, 'title', '')) + siteMeta.name.separator + siteMeta.name.full
    const ogDesc = _.get(article, 'og_description', siteMeta.desc)
    const ogImage = _.get(article, 'og_image.resized_targets.tablet.url') ? article.og_image.resized_targets.tablet : siteMeta.ogImage
    const metaOgImage = [
      { property: 'og:image', content: ogImage.url }
    ]
    if (ogImage.height) {
      metaOgImage.push({ property: 'og:image:height', content: ogImage.height })
    }
    if (ogImage.width) {
      metaOgImage.push({ property: 'og:image:width', content: ogImage.width })
    }
    return (
      <div>
        <Helmet
          title={ogTitle}
          link={[
            { rel: 'canonical', href: canonical }
          ]}
          meta={[
            { name: 'description', content: ogDesc },
            { name: 'twitter:title', content: ogTitle },
            { name: 'twitter:image', content: ogImage.url },
            { name: 'twitter:description', content: ogDesc },
            { name: 'twitter:card', content: 'summary_large_image' },
            { property: 'og:title', content: ogTitle },
            { property: 'og:description', content: ogDesc },
            { property: 'og:type', content: 'article' },
            { property: 'og:url', content: canonical },
            { property: 'og:rich_attachment', content: 'true' },
            ...metaOgImage
          ]}
        />
        <div itemScope itemType="http://schema.org/Article">
          <div itemProp="publisher" itemScope itemType="http://schema.org/Organization">
            <meta itemProp="name" content="報導者" />
            <meta itemProp="email" content="contact@twreporter.org" />
            <link itemProp="logo" href="https://www.twreporter.org/asset/logo-large.png" />
            <link itemProp="url" href="https://www.twreporter.org/" />
          </div>
          <link itemProp="mainEntityOfPage" href={canonical} />
          <meta itemProp="dateModified" content={date2yyyymmdd(_.get(article, 'updated_at'))} />
          <ReadingProgress ref={this._rp}/>
          {isFetching ? <ArticlePlaceholder /> : (
            <div
              id="article-body"
              ref={this._articleBody}
            >
              <ArticleComponent
                post={article}
                relatedTopic={postTopic}
                relatedPosts={relatedPosts}
                fontLevel={fontLevel}
                onFontLevelChange={this.handleFontLevelChange}
                LinkComponent={Link}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
}

Article.propTypes = {
  fontLevel: PropTypes.string,
  entities: PropTypes.object,
  match: PropTypes.object,
  selectedPost: PropTypes.object
}

Article.defaultProps = {
  fontLevel: _fontLevel.small,
  entities: {},
  match: {}, // react-router `match` object
  selectedPost: {}
}

export function mapStateToProps(state) {
  const fontLevel = _.get(state, [ reduxStateFields.settings, 'fontLevel' ], _fontLevel.small)
  const entities = state[reduxStateFields.entities]
  const selectedPost = state[reduxStateFields.selectedPost]
  return {
    fontLevel,
    entities,
    selectedPost
  }
}

function changeFontLevel(fontLevel) {
  return function (dispatch) {
    dispatch({
      type: actionTypes.settings.changeFontLevel,
      payload: fontLevel
    })
  }
}

export { Article }
export default connect(mapStateToProps, { fetchAFullPost, changeFontLevel })(Article)
