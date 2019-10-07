import { renderElement as renderV2Element } from '@twreporter/react-article-components/lib/components/body'
import { sourceHanSansTC as fontWeight } from '@twreporter/core/lib/constants/font-weight'
import alignmentConsts from '@twreporter/react-article-components/lib/constants/element-alignment'
import Img from '@twreporter/react-article-components/lib/components/img-with-placeholder'
import mq from '../../../utils/media-query'
import React from 'react'
import styled, { css } from 'styled-components'
import YoutubePlayer from 'react-youtube'
// lodash
import get from 'lodash/get'

const _ = {
  get
}

const buildElementMarginCss = (horizontalMargin = '') => css`
  margin: 1.5em ${horizontalMargin};
  &:first-child {
    margin-top: 0;
  }
  &:last-child {
    margin-bottom: 0;
  }
`

const BlockQuote = styled.blockquote`
  ${buildElementMarginCss('1.33rem')}
  font-style: italic;
  padding-left: 18px;
  line-height: 1.85;
  font-size: 18px;
  font-weight: 300;
  white-space: pre-wrap;
`

const YouTubeContainer = styled.div`
  ${buildElementMarginCss('auto')}
  iframe {
    max-width: 100%;
    ${mq.tabletAndAbove`
      width: 560px;
      height: 315px;
    `}
  }
`

export const Paragraph = styled.div`
  ${buildElementMarginCss('auto')}
  color: #262626;
  font-size: 18px;
  line-height: 1.8;
  text-align: center;
  letter-spacing: .4px;
  white-space: pre-wrap;
  font-weight: ${fontWeight.normal};
`

const ImageContainer = styled.div`
  ${buildElementMarginCss('auto')}
  max-width: 100%;
  ${mq.tabletAndAbove`
    width: 560px;
  `}
`

const ElementCaption = styled.div`
  color: #808080;
  font-size: 16px;
  line-height: 1.8;
  margin: .6em 1.33em 0 1.33em;
`

const renderTopicContent = (data) => {
  if (!Array.isArray(data)) { return null }
  return data.map((ele) => {
    switch(ele.type) {
      case 'blockquote':
        return (
          <BlockQuote
            key={ele.id}
            dangerouslySetInnerHTML={{ __html: _.get(ele, 'content.0', '') }}
          />
        )
      case 'youtube': {
        const { description, youtubeId } = _.get(ele, 'content.0', {})
        if (!youtubeId) {
          return null
        }
        return (
          <YouTubeContainer key={ele.id}>
            <YoutubePlayer videoId={youtubeId} />
            {description ? <ElementCaption>{description}</ElementCaption> : null}
          </YouTubeContainer>
        )
      }
      case 'image': {
        const { description, desktop, mobile, tablet, tiny } = _.get(ele, 'content.0', {})
        return (
          <ImageContainer key={ele.id}>
            <div>
              <Img
                alt={description}
                imageSet={[
                  tiny,
                  mobile,
                  tablet,
                  desktop
                ]}
                defaultImage={mobile}
              />
            </div>
            {description ? <ElementCaption>{description}</ElementCaption> : null}
          </ImageContainer>
        )
      }
      case 'unstyled':
        return (
          <Paragraph
            key={ele.id}
            dangerouslySetInnerHTML={{ __html: get(ele, 'content.0', '') }}
          />
        )
      default:
        // Force alignment to be `center-small`
        return renderV2Element({
          ...ele,
          alignment: alignmentConsts.centerSmall
        })
    }
  })
}

export default renderTopicContent
