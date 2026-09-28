import {Markup, MarkupView} from "./markup"
import type * as p from "core/properties"
import {UIComponent} from "core/vdom"
import type {VNode} from "core/vdom"
import {escape} from "core/util/string"

import * as markup_css from "styles/widgets/markup.css"

export class ParagraphView extends MarkupView {
  declare readonly model: Paragraph
  declare readonly signals: p.SignalsOf<Paragraph.Props>

  override process_tex(text: string): string {
    if (this.provider.MathJax == null) {
      return escape(text)
    }

    const tex_parts = this.provider.MathJax.find_tex(text)
    const processed_text: string[] = []

    let last_index: number | undefined = 0
    for (const part of tex_parts) {
      processed_text.push(escape(text.slice(last_index, part.start.n)))
      processed_text.push(this.provider.MathJax.tex2svg(part.math, {display: part.display}).outerHTML)

      last_index = part.end.n
    }

    if (last_index! < text.length) {
      processed_text.push(escape(text.slice(last_index)))
    }

    return processed_text.join("")
  }

  override component(): VNode {
    const {text} = this.signals
    const markup = (() => {
      if (this.has_math_disabled()) {
        return <p class={markup_css.markup}>{text}</p>
      } else {
        const {value} = text
        const set_html = (el: HTMLElement | null): void => {
          if (el != null) {
            el.innerHTML = this.process_tex(value)
          }
        }
        return <p class={markup_css.markup} ref={set_html}></p>
      }
    })()

    return <UIComponent parent={this.resolved_props}>{markup}</UIComponent>
  }
}

export namespace Paragraph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props
}

export interface Paragraph extends Paragraph.Attrs {}

export class Paragraph extends Markup {
  declare properties: Paragraph.Props
  declare __view_type__: ParagraphView

  static {
    this.prototype.default_view = ParagraphView
  }
}
