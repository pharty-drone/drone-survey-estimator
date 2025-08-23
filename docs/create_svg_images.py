import math

# Utility to write simple SVG

def header(width, height):
    return f"<svg xmlns='http://www.w3.org/2000/svg' width='{width}' height='{height}' viewBox='0 0 {width} {height}'>\n"

def footer():
    return "</svg>\n"

# 1. grid_example
def grid_example():
    w,h=500,300
    lines=[]
    for x in range(0,w+1,50):
        lines.append(f"<line x1='{x}' y1='0' x2='{x}' y2='{h}' stroke='blue' stroke-width='1' />")
    for y in range(0,h+1,50):
        lines.append(f"<line x1='0' y1='{y}' x2='{w}' y2='{y}' stroke='blue' stroke-width='1' />")
    rect="<rect x='0' y='0' width='{w}' height='{h}' fill='none' stroke='black'/>".format(w=w,h=h)
    svg = header(w,h)+rect+"".join(lines)+footer()
    open('docs/images/grid_example.svg','w').write(svg)

# 2. oblique_example
def oblique_example():
    w,h=500,300
    lines=[]
    for k in range(-300,500,50):
        x1=k; y1=0; x2=k+300; y2=300
        lines.append(f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='green' stroke-width='1' />")
    rect=f"<rect x='0' y='0' width='{w}' height='{h}' fill='none' stroke='black'/>"
    svg=header(w,h)+rect+"".join(lines)+footer()
    open('docs/images/oblique_example.svg','w').write(svg)

# 3. lpt_split
def lpt_split():
    w,h=500,300
    colors=['red','blue','green','orange']
    lines=[]
    for i,color in enumerate(colors):
        y0=i*75
        for y in range(y0+10,y0+70,15):
            lines.append(f"<line x1='0' y1='{y}' x2='{w}' y2='{y}' stroke='{color}' stroke-width='3' />")
    svg=header(w,h)+"".join(lines)+footer()
    open('docs/images/lpt_split.svg','w').write(svg)

# 4. mission_time_breakdown
def mission_time_breakdown():
    w,h=500,300
    stages=['Climb','Survey','Turns','Cont']
    times=[5,20,6,4]
    max_t=max(times)
    bars=[]
    bar_width=80
    for i,(stage,t) in enumerate(zip(stages,times)):
        height=t/max_t*(h-40)
        x=40+i*(bar_width+20)
        y=h-height-20
        bars.append(f"<rect x='{x}' y='{y}' width='{bar_width}' height='{height}' fill='steelblue' />")
        bars.append(f"<text x='{x+bar_width/2}' y='{h-5}' font-size='20' text-anchor='middle'>{stage}</text>")
    svg=header(w,h)+"".join(bars)+footer()
    open('docs/images/mission_time_breakdown.svg','w').write(svg)

# 5. system_architecture
def system_architecture():
    w,h=600,300
    boxes=[(50,60,'UI/HUD'),(250,60,'Geometry'),(450,60,'Planner'),(50,180,'Fleet'),(250,180,'Estimator'),(450,180,'Scheduler')]
    elements=[]
    for x,y,label in boxes:
        elements.append(f"<rect x='{x}' y='{y}' width='120' height='60' fill='none' stroke='black' />")
        elements.append(f"<text x='{x+60}' y='{y+35}' font-size='16' text-anchor='middle'>{label}</text>")
    svg=header(w,h)+"".join(elements)+footer()
    open('docs/images/system_architecture.svg','w').write(svg)

if __name__=='__main__':
    grid_example()
    oblique_example()
    lpt_split()
    mission_time_breakdown()
    system_architecture()
