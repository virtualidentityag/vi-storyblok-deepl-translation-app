<template >
  <div class="bodyFontStyle">
    <el-row>
      <el-col :span="12">
        <p>Configuration screen</p>
      </el-col>
      <el-col :span="6" :offset="5">
        <el-button
          icon="el-icon-setting"
          type="primary"
          size="mini"
          v-on:click="closeSettings"
          >Close</el-button
        >
      </el-col>
    </el-row>
    <el-form ref="form" :model="form" size="mini">
      <el-col>
        <el-form-item label="Api Key">
          <el-input v-model="form.apiKey"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="mini"
            @click="
              handleSubmit({
                ...form.apiKeyObj,
                value: form.apiKey.trim(),
              })
            "
            >Update</el-button
          >
        </el-form-item>
        <el-form-item label="Mode Of translation">
          <el-input v-model="form.modeOfTranslation"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="mini"
            @click="
              handleSubmit({
                ...form.modeOfTranslationObj,
                value: form.modeOfTranslation.trim(),
              })
            "
            >Update</el-button
          >
        </el-form-item>
      </el-col>
    </el-form>
  </div>
</template>

<script>
import { Notification } from "element-ui";
import { updateDataSourceEntries } from "../utils/services";

export default {
  name: "ConfigurationScreen",
  props: ["deeplKey", "mode", "deeplKeyObj", "modeObj"],
  data() {
    return {
      spaceId: this.$route.query.space_id,
      form: {
        apiKey: this.deeplKey,
        apiKeyObj: this.deeplKeyObj,
        modeOfTranslation: this.mode,
        modeOfTranslationObj: this.modeObj,
      },
    };
  },

  // mounted() {},

  methods: {
    async handleSubmit(dataSourceObj) {
      console.log("first", dataSourceObj);
      let response = await updateDataSourceEntries(this.spaceId, dataSourceObj);
      if (response.status === 204) {
        this.successMessage();
        if (dataSourceObj.name === "Deepl-Api-key") {
          this.$emit("updateApiKey", {
            key: this.form.apiKey,
            obj: this.form.apiKeyObj,
          });
        } else
          this.$emit("updateMode", {
            mode: this.form.modeOfTranslation,
            obj: this.form.modeOfTranslationObj,
          });
      } else this.errorMessage();
    },

    closeSettings() {
      this.$emit("close");
    },

    successMessage() {
      Notification({
        title: "Success",
        message: "Configurations updated successfully!",
        type: "success",
        // duration: 0,
      });
    },
    errorMessage(_message) {
      Notification({
        title: "Error",
        message: "Something went wrong, try again later.",
        type: "error",
      });
    },
  },
};
</script>

<style>
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.bodyFontStyle {
  font-family: sans-serif;
}
.el-notification__title {
  font-weight: 700;
  font-size: 16px;
  color: #303133;
  margin: 0;
  font-family: sans-serif;
}
.el-notification__content {
  font-size: 14px;
  line-height: 21px;
  margin: 6px 0 0;
  color: #606266;
  text-align: justify;
  font-family: sans-serif;
}
.el-notification {
  display: flex;
  width: 270px;
  padding: 14px 26px 14px 13px;
  border-radius: 8px;
  box-sizing: border-box;
  border: 1px solid #ebeef5;
  position: fixed;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  transition: opacity 0.3s, transform 0.3s, left 0.3s, right 0.3s, top 0.4s,
    bottom 0.3s;
  overflow: hidden;
}
p {
  /* font-size: smaller; */
  font-size: 14px;
  color: #606266;
}
.error-text {
  color: #f56c6c;
  font-weight: bold;
}
</style>
