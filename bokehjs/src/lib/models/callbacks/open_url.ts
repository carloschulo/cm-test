import {Callback} from "./callback"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {replace_placeholders} from "core/util/templating"
import {isString} from "core/util/types"
import type * as p from "core/properties"

export function is_safe_url(url: string): boolean {
  let base = "http://localhost"
  try {
    if (typeof window !== "undefined" && window.location?.href) {
      base = window.location.href
    }
  } catch {
    // Ignore restricted window.location access
  }

  try {
    const parsed = new URL(url, base)
    const allowed_protocols = ["http:", "https:", "mailto:", "ftp:", "tel:"]
    return allowed_protocols.includes(parsed.protocol) || parsed.protocol === "file:"
  } catch {
    return false
  }
}

export namespace OpenURL {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    url: p.Property<string>
    same_tab: p.Property<boolean>
  }
}

export interface OpenURL extends OpenURL.Attrs {}

export class OpenURL extends Callback {
  declare properties: OpenURL.Props

  static {
    this.define<OpenURL.Props>(({Bool, Str}) => ({
      url: [ Str, "http://" ],
      same_tab: [ Bool, false ],
    }))
  }

  navigate(url: string): void {
    if (!is_safe_url(url)) {
      throw new Error(`OpenURL: Unsafe URL scheme rejected: ${url}`)
    }
    if (this.same_tab) {
      window.location.href = url
    } else {
      window.open(url)
    }
  }

  execute(_cb_obj: unknown, {source}: {source: ColumnarDataSource}): void {
    const open_url = (i: number) => {
      const url = replace_placeholders(this.url, source, i, undefined, undefined, encodeURI)
      if (!isString(url)) {
        throw new Error("HTML output is not supported in this context")
      }
      this.navigate(url)
    }

    const {selected} = source

    for (const i of selected.indices) {
      open_url(i)
    }

    for (const i of selected.line_indices) {
      open_url(i)
    }

    // TODO: multiline_indices: {[key: string]: number[]}
  }
}
