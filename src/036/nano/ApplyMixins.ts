export default function ApplyMixins (baseClass: any, mixins: any[])
{
    let newClass = baseClass;

    mixins.forEach((mixin) => {

        newClass = mixin(newClass);

    });

    return newClass;
}
