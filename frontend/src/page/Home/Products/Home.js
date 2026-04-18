import { CurrentlyViewedSlider, FlashSaleSlider, SuggestCurrentlySlider, TopProductSection } from "../../../components/ViewProduct/HomeView"

const Home = () => {
    return (
        <>
            <div className="homepage">
                <FlashSaleSlider />
                <SuggestCurrentlySlider />
                <TopProductSection categoryId={1} title="ĐIỆN THOẠI NỔI BẬT" background="phone" link='sanpham/dien-thoai' />
                <TopProductSection categoryId={2} title="LAPTOP NỔI BẬT" background="laptop" link='sanpham/laptop' />
                <TopProductSection categoryId={3} title="TABLET NỔI BẬT" background="tablet" link='sanpham/may-tinh-bang' />
                <CurrentlyViewedSlider />
            </div>
        </>
    )
}
export default Home