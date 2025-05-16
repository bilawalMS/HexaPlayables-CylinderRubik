import { NATIVE } from "cc/env";
import { gfx } from 'cc';

export const UIVertexFormatX: any = {};
if(NATIVE) {
    UIVertexFormatX.vfmtPosUvColor = [
        new gfx.Attribute(gfx.AttributeName.ATTR_POSITION, gfx.Format.RGB32F),
        new gfx.Attribute(gfx.AttributeName.ATTR_TEX_COORD, gfx.Format.RG32F),
        new gfx.Attribute(gfx.AttributeName.ATTR_COLOR, gfx.Format.RGBA32F),
    ];
    
    UIVertexFormatX.getComponentPerVertex = function getComponentPerVertex (attrs: gfx.Attribute[]) {
        let count = 0;
        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            const info = gfx.FormatInfos[attr.format];
            count += info.count;
        }
    
        return count;
    }
}