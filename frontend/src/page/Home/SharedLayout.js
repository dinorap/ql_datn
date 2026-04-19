import { BannerSlider, Banner, Category } from "../../components/Header&Footer/HeaderFooter";
import { Outlet } from "react-router-dom";
import "./SharedLayout.scss";

const SharedLayout = () => {

    return (
        <div className="home-page-bg">
            <div className="home-hero-row">
                <aside className="home-hero-row__sidebar">
                    <Category />
                </aside>
                <div className="home-hero-row__main home-hero-column">
                    <BannerSlider />
                </div>
            </div>
            <div className="home-banner-below">
                <Banner />
            </div>
            <Outlet />
        </div>
    );
};

export default SharedLayout;

