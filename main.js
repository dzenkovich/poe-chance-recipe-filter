const ACCOUNT = 'Brockb'
const LEAGUE = 'SSF Sentinel'
const ALLOWED_TAB_TYPES = ['NormalStash', 'PremiumStash']
const CELL_SIZE = 30

const STYLES = `
  .crh {
    position:fixed;
    top:0;
    right:0;
    background: rgba(0, 0, 0, 0.95);
    padding: 20px;
    z-index: 100;
    min-width: 600px;    
  }
  
  .crh .attention {
    background-color: #3C3C3C;
  }
  
  .crh-main {
  }
  
  #crh-items {
    max-height: 500px;
    overflow: auto;
  }
  
  .chr-item {
    display: inline-block;
    margin-left: 15px;
    box-sizing: border-box;
    padding: 10px;
    text-align: center;
    width: 150px;
    height: 210px;
    border: 1px solid #141414;
  }
  
  .chr-item-info {
    display: inline-block;    
  }
  
  .chr-item-parts {
    display: inline-block;
    margin-left: 15px;
  }
  
  .crh-item-part {
    width: 30px;
    height: 30px;
    margin-top: 30px;
    border: 1px solid #141414;
    opacity: 0.2;
  }
  
  .crh-item-part.present {
    opacity: 1;
  }
  
  .crh-item-part:first-child {
    margin-top: 0;
  }
  
  .crh-item-part.rare {
    background-color: #fff246;
  }
  
  .crh-item-part.magic {
    background-color: #7888ff;
  }
  
  .crh-item-part.normal {
    background-color: #fff;
  }
  
  .crh h3 {
    margin-bottom: 30px
  }
  
  .crh section {
    margin-bottom: 30px
  }
  
  .crh .crh-collapsed {
    display: none;
  }
  
  .crh.closed {
    min-width: 0;
  }
  
  .crh.closed .crh-main {
    display: none;
  }
  
  .crh.closed .crh-collapsed {
    display: block;
  }
  
  #crh-filter-code {
    width: 100%;
    
  }
`

const UITemplate = `
<div class="crh">
  <div class="crh-main">
    <section>
      <h3>Chance Recipe Helper</h3>
      <p>Manage tabs you want to be skipped in items search</p>
      <div id="crh-tabs"></div>
    </section>
    <section>
      <h3>Same Name Rare Helper</h3>
      <ul id="sn-items"></ul>
    </section>
    <section class="chr-list-section">
      <p>List of all your uniques and related rare/magic/normal items</p>
      <a id="crh-refresh" class="button2 important">refresh</a>
      <div id="crh-items"></div>
    </section>
    <section>
      <textarea id="crh-filter-code"></textarea>
    </section>
    <div>
      <a id="crh-hide" class="button2">hide</a>
    </div>
  </div>
  <div class="crh-collapsed">
    <a id="crh-show" class="button2">show</a>
  </div>
</div>
`

const TabTemplate = `
<div class="button1 important" style="display: inline-block; margin-right: 10px;">
  <label><input type="checkbox">#name#</label>
</div>
`

const UniqueTemplate = `
<div class="chr-item">
    <p>#name# <b>#type#</b></p>
    <div class="chr-item-info">
        <img src="#icon#" width="#width#" height="#height#"/>
        <div>#note#</div>
        <input type="checkbox"/>
    </div>    
    <div class="chr-item-parts">
        <div class="crh-item-part rare"></div>
        <div class="crh-item-part magic"></div>
        <div class="crh-item-part normal"></div>
    </div>
</div>
`

function ChanceRecipeHelper() {
  this.tabs = []
  this.activeTabs = []
  this.activeItems = []
  this.items = {}
  this.uniques = []

  const _getTabInfo = (tabIndex, isWithTabs, callback) => {
    const query =
      $.get('/character-window/get-stash-items', {
        accountName: ACCOUNT,
        tabIndex: tabIndex,
        league: LEAGUE,
        tabs: isWithTabs,
      }, result => {
        callback(result)
      })
  }

  const _renderTemplate = (template, data) => {
    let names = template.match(/#\w+#/g)
    if (!names) return $(template)
    return $(names.reduce((result, name) => {
      return result.replace(name, data[name.substr(1, name.length - 2)])
    }, template))
  }

  this.loadPreferences = () => {
    let tabsData = localStorage.getItem('crh-tabs')
    if (tabsData) {
      this.activeTabs = JSON.parse(tabsData)
    }

    let itemsData = localStorage.getItem('crh-items')
    if (itemsData) {
      this.activeItems = JSON.parse(itemsData)
    }
  }

  this.addStyles = () => {
    $(document.head).append('<style>' + STYLES + '</style>')
  }

  this.drawUI = () => {
    this.$modal = $(UITemplate)
    this.$modal.$ulTabs = this.$modal.find('#crh-tabs')
    this.$modal.$ulItems = this.$modal.find('#crh-items')
    this.$modal.$ulNames = this.$modal.find('#sn-items')
    this.$modal.$refresh = this.$modal.find('#crh-refresh')
    this.$modal.$refresh.on('click', () => {
      this.loadItems()
      this.$modal.$refresh.removeClass('attention')
    })
    this.$modal.find('#crh-hide').on('click', () => {
      this.$modal.addClass('closed')
    })
    this.$modal.find('#crh-show').on('click', () => {
      this.$modal.removeClass('closed')
    })
    this.$modal.$area = this.$modal.find('#crh-filter-code')

    $('body').append(this.$modal)
  }

  this.toggleTab = (tab, active) => {
    let id = tab.id

    if (active) {
      this.activeTabs.indexOf(id) === -1 && this.activeTabs.push(id)
      this.$modal.$refresh.addClass('attention')
    } else {
      let index = this.activeTabs.indexOf(id)
      this.activeTabs.splice(index, 1)
    }

    localStorage.setItem('crh-tabs', JSON.stringify(this.activeTabs))
  }

  this.renderTabs = () => {
    this.$modal.$ulTabs.append(this.tabs.map(tab => {
      let $tab = _renderTemplate(TabTemplate, { name: tab.n })
      $tab.find('input').on('change', e => {
        this.toggleTab(tab, e.target.checked)
      }).attr('checked', tab.isActive)
      return $tab
    }))
  }

  this.loadData = () => {
    this.loadTabs().then(this.loadItems)
  }

  this.loadTabs = () => {
    return new Promise(resolve => {
      _getTabInfo(0, 1, result => {
        if (!result.tabs) throw 'Tabs not found! Invalid response, or connectivity problem.'
        resolve(result.tabs.filter(tab => {
          return ALLOWED_TAB_TYPES.indexOf(tab.type) >= 0
        }))
      })
    }).then(tabs => {
      if (!this.activeTabs.length) this.activeTabs = tabs.map(tab => tab.id)

      this.tabs = tabs.map(tab => {
        tab.isActive = this.activeTabs.indexOf(tab.id) >= 0
        return tab
      })
      this.renderTabs()
    })
  }

  this.toggleUnique = (unique, active) => {
    let id = unique.id

    if (active) {
      this.activeItems.indexOf(id) === -1 && this.activeItems.push(id)
    } else {
      let index = this.activeItems.indexOf(id)
      this.activeItems.splice(index, 1)
    }

    this.generateFilterCode()
    localStorage.setItem('crh-items', JSON.stringify(this.activeItems))
  }

  this.loadItems = () => {
    this.$modal.$ulItems.html('')
    this.$modal.$ulNames.html('')

    return Promise.all(this.tabs.filter(tab => tab.isActive).map(tab => {
      return new Promise(resolve => {
        _getTabInfo(tab.i, 0, result => {
          resolve(result.items.map(item => {
            item.tabName = tab.n
            return item
          }))
        })
      })
    })).then(tabsItems => {
      this.items = [].concat.apply([], tabsItems)

      let { uniques, others } = this.items.reduce((result, item) => {
        // frameTypes: 3 -> unique, 2 -> rare, 1 -> magic
        if (item.frameType === 3) {
          // exclude unique jewels and flasks
          if (item.baseType.search(/Jewel|Flask$/) === -1) {
            result.uniques.push(item)
          }
        }
        if (item.frameType < 3) {
          result.others.push(item)
        }
        return result
      }, { uniques: [], others: [] })

      if (!this.activeItems.length) this.activeItems = uniques.map(unique => unique.id)

      uniques.map(unique => {
        unique.isActive = this.activeItems.indexOf(unique.id) >= 0
        unique.items = {}

        others.reduce((result, item) => {
          if (item.baseType === unique.baseType) {
            if (item.frameType === 2) {
              unique.items.rare = item
            }
            if (item.frameType === 1) {
              unique.items.magic = item
            }
            if (item.frameType === 0) {
              unique.items.normal = item
            }
          }

          return unique
        }, unique)
      })

      const rareNames = others.filter(item => item.frameType === 2 && item.identified).reduce((result, item) => {
        if (!result[item.name]) result[item.name] = 0
        result[item.name] += 1
        return result
      }, {})
      this.$modal.$ulNames.append(Object.keys(rareNames).filter(name => rareNames[name] > 1).map(name => {
        return `<li>${name}</li>`
      }))

      this.$modal.$ulItems.append(uniques.map(unique => {
        let $item = _renderTemplate(UniqueTemplate, {
          name: unique.name.replace(/<<.+>>/g, ''),
          type: unique.baseType,
          width: unique.w * CELL_SIZE,
          height: unique.h * CELL_SIZE,
          icon: unique.icon,
          note: unique.note && unique.note.replace('~price', '') || '',
        })

        $item.find('input').on('change', e => {
          this.toggleUnique(unique, e.target.checked)
        }).attr('checked', unique.isActive)

        if (unique.items.rare) $item.find('.crh-item-part.rare').addClass('present')
        if (unique.items.magic) $item.find('.crh-item-part.magic').addClass('present')
        if (unique.items.normal) $item.find('.crh-item-part.normal').addClass('present')

        return $item
      }))

      this.uniques = uniques
    }).then(this.generateFilterCode)
  }

  this.generateFilterCode = () => {
    let sets = this.uniques.reduce((result, unique) => {
      if (this.activeItems.indexOf(unique.id) >= 0) {
        if (!unique.items.rare) {
          result.rare[unique.baseType] = true
          result.normal[unique.baseType] = true
        }
        if (!unique.items.magic) {
          result.magic[unique.baseType] = true
          result.normal[unique.baseType] = true
        }
        if (!unique.items.normal) result.normal[unique.baseType] = true
      }

      return result
    }, { rare: {}, magic: {}, normal: {} })

    let code = ''
    let rare = Object.keys(sets.rare)
    let magic = Object.keys(sets.magic)
    let normal = Object.keys(sets.normal)

    if (rare.length) {
      code += `Show
  Rarity Rare
  BaseType ${rare.map(name => '"' + name + '"').join(' ')}
  SetBorderColor 0 200 0

`
    }
    if (magic.length) {
      code += `Show
  Rarity Magic
  BaseType ${magic.map(name => '"' + name + '"').join(' ')}
  SetBorderColor 0 200 0

`
    }
    if (normal.length) {
      code += `Show
  Rarity Normal
  BaseType ${normal.map(name => '"' + name + '"').join(' ')}
  SetBorderColor 0 200 0

`
    }

    this.$modal.$area.val(code)
  }

  this.loadPreferences()
  this.addStyles()
  this.drawUI()
  this.loadData()
}

// DOMContentLoaded doesn not get triggered in here for some reason
const JQWait = window.setInterval(() => {
  if (window.$ && $.fn.jquery) {
    new ChanceRecipeHelper()
    window.clearInterval(JQWait)
  }
}, 100)
