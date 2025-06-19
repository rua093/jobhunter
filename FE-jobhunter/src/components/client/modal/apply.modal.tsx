import { useAppSelector } from "@/redux/hooks";
import { IJob } from "@/types/backend";
import { ProForm, ProFormText } from "@ant-design/pro-components";
import { Button, Col, ConfigProvider, Divider, Modal, Row, Upload, message, notification, Tag, Alert, Space } from "antd";
import { useNavigate } from "react-router-dom";
import enUS from 'antd/lib/locale/en_US';
import { UploadOutlined, PhoneOutlined, UserOutlined, ToolOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { callCreateResume, callUploadSingleFile, callCheckUserAppliedToJob } from "@/config/api";
import { useState, useEffect } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';


interface IProps {
    isModalOpen: boolean;
    setIsModalOpen: (v: boolean) => void;
    jobDetail: IJob | null;
}

const ApplyModal = (props: IProps) => {
    const { isModalOpen, setIsModalOpen, jobDetail } = props;
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);
    const [urlCV, setUrlCV] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [hasApplied, setHasApplied] = useState<boolean>(false);
    const [missingInfo, setMissingInfo] = useState<string[]>([]);
    const [skillMismatch, setSkillMismatch] = useState<boolean>(false);
    const [experienceMismatch, setExperienceMismatch] = useState<boolean>(false);
    const [resume, setResume] = useState<any>(null);


    const navigate = useNavigate();

    // Kiểm tra thông tin người dùng
    const checkUserInfo = () => {
        const missing = [];
        if (!user?.phone) missing.push('Số điện thoại');
        if (!user?.skills || user.skills.length === 0) missing.push('Kỹ năng hiện có');
        if (!user?.level) missing.push('Kinh nghiệm');
        setMissingInfo(missing);
        return missing.length === 0;
    };

    // Kiểm tra kỹ năng có phù hợp không
    const checkSkillMatch = () => {
        if (!jobDetail?.skills || !user?.skills) return true;
        const jobSkills = jobDetail.skills.map((s: any) => s.name?.toLowerCase() || '').filter(Boolean);
        const userSkills = user.skills.map((s: any) => s.name?.toLowerCase() || '').filter(Boolean);
        const hasMatch = jobSkills.some((jobSkill: string) => 
            userSkills.some((userSkill: string) => userSkill.includes(jobSkill) || jobSkill.includes(userSkill))
        );
        setSkillMismatch(!hasMatch);
        return hasMatch;
    };

    // Kiểm tra kinh nghiệm có phù hợp không
    const checkExperienceMatch = () => {
        if (!jobDetail?.level || !user?.level) return true;
        const levelOrder = ['INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR'];
        const jobLevelIndex = levelOrder.indexOf(jobDetail.level);
        const userLevelIndex = levelOrder.indexOf(user.level);
        const isMatch = userLevelIndex >= jobLevelIndex;
        setExperienceMismatch(!isMatch);
        return isMatch;
    };

    // Kiểm tra đã apply chưa
    const checkAlreadyApplied = async () => {
        try {
            if (!jobDetail?.id) return false;
            const res = await callCheckUserAppliedToJob(Number(jobDetail.id));
            if (res && res.data) {
                const alreadyApplied = res.data;
                setHasApplied(alreadyApplied);
                return alreadyApplied;
            }
        } catch (error) {
            console.error('Error checking applied status:', error);
        }
        return false;
    };

    useEffect(() => {
        if (isModalOpen && jobDetail) {
            if (isAuthenticated) {
                checkUserInfo();
                checkSkillMatch();
                checkExperienceMatch();
                checkAlreadyApplied();
            } else {
                // Reset các state khi chưa đăng nhập
                setMissingInfo([]);
                setSkillMismatch(false);
                setExperienceMismatch(false);
                setHasApplied(false);
            }
        }
    }, [isModalOpen, jobDetail, user, isAuthenticated]);

    const handleOkButton = async () => {
        setLoading(true);

        try {
            // Kiểm tra đã đăng nhập chưa
            if (!isAuthenticated) {
                setIsModalOpen(false);
                navigate(`/login?callback=${window.location.href}`);
                return;
            }

            // Kiểm tra job có active không (bao gồm cả trạng thái đóng và hết hạn)
            if (!jobDetail?.active) {
                message.error("Công việc này đã đóng tuyển dụng hoặc hết thời hạn!");
                setLoading(false);
                return;
            }

            // Kiểm tra đã apply chưa
            if (hasApplied) {
                message.error("Bạn đã ứng tuyển công việc này rồi!");
                setLoading(false);
                return;
            }

            // Kiểm tra thông tin cá nhân
            if (missingInfo.length > 0) {
                message.error(`Vui lòng cập nhật thông tin: ${missingInfo.join(', ')}`);
                setLoading(false);
                return;
            }

            // Kiểm tra file CV
                if (!urlCV) {
                message.error("Vui lòng upload file CV!");
                    setLoading(false);
                    return;
                }

            // Hiển thị cảnh báo nếu kỹ năng/kinh nghiệm không phù hợp
            if (skillMismatch || experienceMismatch) {
                const warnings = [];
                if (skillMismatch) warnings.push('Kỹ năng không phù hợp');
                if (experienceMismatch) warnings.push('Kinh nghiệm không phù hợp');
                
                Modal.confirm({
                    title: 'Cảnh báo',
                    content: `${warnings.join(', ')} với yêu cầu công việc. Bạn có muốn tiếp tục ứng tuyển không?`,
                    okText: 'Tiếp tục ứng tuyển',
                    cancelText: 'Cập nhật thông tin',
                    onOk: async () => {
                        await submitResume();
                    },
                    onCancel: () => {
                        setLoading(false);
                    }
                });
                return;
            }

            // Nếu tất cả đều OK, submit
            await submitResume();

        } catch (error) {
            console.error('Error in handleOkButton:', error);
            notification.error({
                message: 'Có lỗi xảy ra',
                description: 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
            });
        } finally {
            setLoading(false);
        }
    };

    const submitResume = async () => {
                if (jobDetail) {
                    const res = await callCreateResume(urlCV, jobDetail?.id, user.email, user.id);
                    if (res.data) {
                message.success("Ứng tuyển thành công!");
                setFileList([]);
                setUrlCV("");
                        setIsModalOpen(false);
                    } else {
                        notification.error({
                            message: 'Có lỗi xảy ra',
                            description: res.message
                        });
                    }
                }
    };

    const propsUpload: UploadProps = {
        maxCount: 1,
        multiple: false,
        accept: ".pdf,.doc,.docx",

        beforeUpload: (file) => {
            const isLt5M = file.size && file.size / 1024 / 1024 < 5;
            const isNotEmpty = file.size > 0;
            const isValidType = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ].includes(file.type);
            const forbiddenChars = /[\\/:*?"<>|@#]/;
            const containsSpace = /\s/; // Kiểm tra có khoảng trắng
            const isValidFileName = file.name && file.name.trim().length > 0 && !forbiddenChars.test(file.name) && !containsSpace.test(file.name);
            if (!isValidFileName) {
                message.error("Tên file không hợp lệ!");
                setUrlCV("");
                return false;
            }

            if (!isValidType) {
                message.error("Chỉ hỗ trợ file PDF, DOC, DOCX!");
                setUrlCV("");
                return false;
            }
            if (!isNotEmpty) {
                message.error("File bị rỗng!");
                setUrlCV("");
                return false;
            }

            if (!isLt5M) {
                message.error("File phải nhỏ hơn 5MB!");
                setUrlCV("");
                return false;
            }

            return true;
        },

        customRequest: async ({ file, onSuccess, onError }: any) => {
            const res = await callUploadSingleFile(file, "resume");
            if (res && res.data) {
                setUrlCV(res.data.fileName);
                if (onSuccess) onSuccess('ok');
            } else {
                setUrlCV("");
                if (onError) {
                    const error = new Error(res.message);
                    onError({ event: error });
                }
            }
        },

        onChange(info) {
            const file = info.file;

            // Kiểm tra lại size, nếu vượt quá thì không cho vào danh sách
            if (!file.size || file.size / 1024 / 1024 > 5) {
                setFileList([]); // xóa khỏi giao diện
                setUrlCV("");
                return;
            }
            const forbiddenChars = /[\\/:*?"<>|@#]/;
            const containsSpace = /\s/; // Kiểm tra có khoảng trắng
            const isValidFileName = file.name && file.name.trim().length > 0 && !forbiddenChars.test(file.name) && !containsSpace.test(file.name);
            if (!isValidFileName) {
                setFileList([]); // xóa khỏi giao diện nếu tên file không hợp lệ
                setUrlCV("");
                return;
            }

            // Nếu hợp lệ, cập nhật lại fileList
            if (file.status === "done") {
                message.success(`${file.name} đã tải lên thành công`);
                setFileList([file]);
            } else if (file.status === "error") {
                message.error(file?.error?.event?.message ?? "Đã có lỗi xảy ra khi upload file.");
                setFileList([]); // xóa khỏi giao diện
                setUrlCV("");
            } else {
                setFileList([file]);
            }
        },

        fileList: fileList, // Liên kết với state
    };


    return (
        <>
            <Modal
                title="Ứng Tuyển Job"
                open={isModalOpen}
                onOk={handleOkButton}
                onCancel={() => setIsModalOpen(false)}
                maskClosable={false}
                okText={
                    !jobDetail?.active ? "Đã đóng tuyển dụng" :
                    hasApplied ? "Đã ứng tuyển" :
                    missingInfo.length > 0 ? "Cập nhật thông tin" :
                    loading ? "Đang xử lý..." : "Ứng tuyển"
                }
                okButtonProps={{
                    disabled: !isAuthenticated || !jobDetail?.active || hasApplied || missingInfo.length > 0 || loading
                }}
                cancelButtonProps={{ style: { display: "none" } }}
                footer={!isAuthenticated ? null : undefined}
                destroyOnClose={true}
            >
                <Divider />
                {isAuthenticated ? (
                    <div>
                        {/* Hiển thị cảnh báo nếu có */}
                        {!jobDetail?.active && (
                            <Alert
                                message="Công việc đã đóng tuyển dụng"
                                description="Công việc này hiện không còn nhận hồ sơ ứng tuyển."
                                type="error"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        {hasApplied && (
                            <Alert
                                message="Đã ứng tuyển"
                                description="Bạn đã ứng tuyển công việc này rồi."
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        {missingInfo.length > 0 && (
                            <Alert
                                message="Thiếu thông tin cá nhân"
                                description={
                                    <div>
                                        <div>Vui lòng cập nhật: {missingInfo.join(', ')}</div>
                                        <Button 
                                            type="primary" 
                                            size="small" 
                                            style={{ marginTop: 8 }}
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                // Mở modal cập nhật thông tin cá nhân
                                                // Có thể sử dụng event hoặc callback để thông báo cho component cha
                                                window.dispatchEvent(new CustomEvent('openUpdateInfoModal'));
                                            }}
                                        >
                                            Cập nhật thông tin ngay
                                        </Button>
                                    </div>
                                }
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        {(skillMismatch || experienceMismatch) && (
                            <Alert
                                message="Thông tin không phù hợp"
                                description={
                                    <div>
                                        {skillMismatch && <div>• Kỹ năng hiện tại không phù hợp với yêu cầu công việc</div>}
                                        {experienceMismatch && <div>• Kinh nghiệm hiện tại không đủ cho vị trí này</div>}
                                    </div>
                                }
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <ConfigProvider locale={enUS}>
                            <ProForm
                                submitter={{
                                    render: () => <></>
                                }}
                            >
                                <Row gutter={[10, 10]}>
                                    <Col span={24}>
                                        <div style={{ marginBottom: 16 }}>
                                            <h4>Thông tin ứng tuyển</h4>
                                            <p>Bạn đang ứng tuyển công việc <b>{jobDetail?.name}</b> tại <b>{jobDetail?.company?.name}</b></p>
                                        </div>
                                    </Col>

                                    {/* Thông tin cá nhân - chỉ đọc */}
                                    <Col span={24}>
                                        <div style={{ marginBottom: 16 }}>
                                            <h5><UserOutlined /> Thông tin cá nhân</h5>
                                            <Row gutter={[16, 8]}>
                                                <Col span={12}>
                                                    <div><strong>Họ tên:</strong> {user?.name}</div>
                                                </Col>
                                                <Col span={12}>
                                                    <div><strong>Email:</strong> {user?.email}</div>
                                                </Col>
                                                <Col span={12}>
                                                    <div>
                                                        <PhoneOutlined /> <strong>Số điện thoại:</strong> 
                                                        {user?.phone ? (
                                                            <span style={{ color: '#52c41a' }}> {user.phone}</span>
                                                        ) : (
                                                            <span style={{ color: '#ff4d4f' }}> Chưa cập nhật</span>
                                                        )}
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div>
                                                        <ClockCircleOutlined /> <strong>Kinh nghiệm:</strong>
                                                        {user?.level ? (
                                                            <Tag color="blue">{user.level}</Tag>
                                                        ) : (
                                                            <span style={{ color: '#ff4d4f' }}> Chưa cập nhật</span>
                                                        )}
                                                    </div>
                                                </Col>
                                                <Col span={24}>
                                                    <div>
                                                        <ToolOutlined /> <strong>Kỹ năng hiện có:</strong>
                                                        {user?.skills && user.skills.length > 0 ? (
                                                            <Space style={{ marginTop: 4 }}>
                                                                {user.skills.map((skill: any, index: number) => (
                                                                    <Tag key={index} color="green">{skill.name}</Tag>
                                                                ))}
                                                            </Space>
                                                        ) : (
                                                            <span style={{ color: '#ff4d4f' }}> Chưa cập nhật</span>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>

                                    {/* Upload CV */}
                                    <Col span={24}>
                                        <ProForm.Item
                                            label={"Upload file CV"}
                                            rules={[{ required: true, message: 'Vui lòng upload file!' }]}
                                        >
                                            <Upload {...propsUpload}>
                                                <Button icon={<UploadOutlined />}>Tải lên CV của bạn ( Hỗ trợ *.doc, *.docx, *.pdf, và &lt; 5MB )</Button>
                                            </Upload>
                                        </ProForm.Item>
                                    </Col>
                                </Row>
                            </ProForm>
                        </ConfigProvider>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ marginBottom: 16 }}>
                            <h4>Bạn chưa đăng nhập hệ thống</h4>
                            <p style={{ color: '#666', marginBottom: 16 }}>
                                Để ứng tuyển công việc <b>{jobDetail?.name}</b> tại <b>{jobDetail?.company?.name}</b>, 
                                vui lòng đăng nhập hoặc tạo tài khoản mới.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <Button 
                                type="primary" 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    navigate('/login?callback=' + encodeURIComponent(window.location.href));
                                }}
                            >
                                Đăng nhập
                            </Button>
                            <Button 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    navigate('/register?callback=' + encodeURIComponent(window.location.href));
                                }}
                            >
                                Đăng ký
                            </Button>
                        </div>
                    </div>
                )}
                <Divider />
            </Modal>
        </>
    );
}

export default ApplyModal;
