export default function Install (baseClass: any, components: any[])
{
    let newClass = baseClass;

    components.forEach(component => {

        newClass = component(newClass);

    });

    return newClass;
}
